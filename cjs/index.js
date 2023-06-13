'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var gunzip = require('gunzip-file');
var csvParse = require('csv-parse');
var stream = require('stream');
var util = require('util');

let cachefolderexists = false;

/**
 * Gets the paths to all the cached files.
 *
 * @return {string[]} File paths.
 */
async function getCacheFiles() {
  if (!cachefolderexists) {
    await CacheFolderEnsure();
  }
  const files = await fs.promises.readdir(getCacheFiles.cachepath);
  return files.filter(f => f.includes('StormEvents_')).map(f => path.join(getCacheFiles.cachepath, f));
}
getCacheFiles.cachepath = path.join('.cache');
getCacheFiles.setCachePath = function (str) {
  getCacheFiles.cachepath = str;
};

/**
 * Creates the .cache folder.
 */
async function CacheFolderEnsure() {
  try {
    await fs.promises.mkdir(getCacheFiles.cachepath);
    cachefolderexists = true;
  } catch (e) {
    // Folder exists.
  }
}

function Info() {}
Info.filepath = path.join(getCacheFiles.cachepath, '.noaa-stormevents.json');
Info._json = null;

/**
 * Changes the filepath for the settings file.
 *
 * @param {string} filePath Location of the settings file.
 */
Info.setFilePath = function (filePath) {
  Info.filepath = filePath;
};

/**
 * Reads file into memory.
 *
 * @return {Object} JSON parsed info file.
 */
Info.read = async function () {
  if (null !== Info._json) {
    return Info._json;
  }
  let file;
  try {
    file = await fs.promises.readFile(Info.filepath);
  } catch (e) {
    // intentionally left blank.
  }
  let json = {};
  if (file) {
    try {
      json = JSON.parse(file);
    } catch (e) {
      // intentionally left blank.
    }
  }
  Info._json = json;
  return json;
};

/**
 * Returns a specific value.
 *
 * @param {string} key Key to retrieve the value for from info.
 * @param {any} _default Optional. Default value to return if nothing found in
 *                       info.
 * @return {any}
 */
Info.readValue = async function (key, _default) {
  const file = await Info.read();
  return file[key] || _default;
};

/**
 * Writes a value to info file.
 *
 * @param {string} key Key to retrieve the value for from info.
 * @param {any} value A value to be JSON encoded.
 */
Info.writeValue = async function (key, value) {
  const file = await Info.read();
  file[key] = value;
  Info._json = file;
  await fs.promises.writeFile(Info.filepath, JSON.stringify(file));
};

/**
 * Replaces the properties in Info with a custom object.
 *
 * @param {Object} obj Static object functions that can replace all (or some) of
 *                     the other Info functions. Useful if you want to store the
 *                      history/info in a database as opposed to a filesystem.
 */
Info.replace = function (obj) {
  for (const [key, value] of Object.entries(obj)) {
    Info[key] = value;
  }
};

/**
 * Downloads files (links) to the cache directory.
 *
 * @param {string[]} links Resolvable HTTP links.
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 */
async function DownloadFiles(links, suppressLogs = false) {
  const files = [];
  const cachedFiles = await getCacheFiles();
  let history = await Info.readValue('history', []);
  for (const link of links) {
    let filename = link.substring(link.lastIndexOf('/') + 1);
    const filepath = path.join(getCacheFiles.cachepath, filename);
    if (cachedFiles.includes(filepath)) {
      history.push(link);
      files.push(filepath);
      continue;
    }
    const file = fs.createWriteStream(filepath);
    const protocol = 0 === link.indexOf('https') ? https : http;
    if (!suppressLogs) {
      console.log('Downloading', link, '\n');
    }
    await new Promise((resolve, reject) => {
      protocol.get(link, res => {
        res.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
        file.on('error', () => {
          reject();
        });
      });
    });
    history.push(link);
    files.push(filepath);
    if (!suppressLogs) {
      console.log('Wrote', filepath, '\n');
    }
  }
  await Info.writeValue('history', [...new Set(history)]);
  return files;
}

/**
 * Extracts all the .gz files in the cache directory, returning the path of the
 * exports.
 *
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 * @return {string[]} File paths.
 */
async function ExtractCacheFiles(suppressLogs = false) {
  const cacheFiles = await getCacheFiles();
  let files = cacheFiles.filter(x => x.match(/.csv.gz$/));
  const extracted = [];
  for (const file of files) {
    const newFile = file.replace(/.gz$/, '');
    if (files.includes(newFile)) {
      if (!suppressLogs) {
        console.log(newFile, 'exists\n  Extraction skipped');
      }
      try {
        await fs.promises.unlink(file);
      } catch (e) {
        if (!suppressLogs) {
          console.error('Unable to delete', file);
        }
      }
      continue;
    }
    await (() => {
      return new Promise(resolve => {
        if (file.includes('.gz')) {
          gunzip(file, newFile, () => {
            resolve();
          });
        } else {
          resolve();
        }
      });
    })();
    if (!suppressLogs) {
      console.log(newFile, 'extracted');
    }
    try {
      await fs.promises.unlink(file);
    } catch (e) {
      if (!suppressLogs) {
        console.error('Unable to delete', file);
      }
    }
    extracted.push(newFile);
  }
  return extracted;
}

const Config = {
  url: 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/'
};

/**
 * Grabs all the StormEvents Links.
 *
 * @return {string[]} URIs.
 */
async function PullLinks() {
  let response;
  const history = await Info.readValue('history', []);
  const url = new URL(Config.url);
  try {
    response = await new Promise((resolve, reject) => {
      const options = {
        host: url.host,
        path: url.pathname,
        port: 443,
        method: 'GET',
        headers: {}
      };
      const request = https.request(options, function (_response) {
        _response.setEncoding('utf8');
        let body = '';
        _response.on('data', chunk => {
          body = body + chunk;
        });
        _response.on('end', () => {
          if (_response.statusCode !== 200) {
            reject({
              code: _response.statusCode,
              message: body
            });
          } else {
            resolve(body);
          }
        });
      });
      request.on('error', e => {
        reject(e);
      });
      request.end();
    });
  } catch (e) {
    throw new Error('object' === typeof e ? JSON.stringify(e) : e);
  }
  if (!response) {
    throw new Error(`No response from ${Config.url}`);
  }
  const links = response.match(/<a[^>]*>([^<]+)<\/a>/g).filter(x => x.includes('.csv.gz')).map(x => {
    return x.match(/href="(.*?)"/)[1];
  }).map(a => Config.url + '/' + a).filter(a => !history.includes(a));
  return links;
}

const pipeline = util.promisify(stream.pipeline);

/**
 * Reads a csv file line by line returning json for the row.
 */
async function* ReadCSV(file) {
  const stream = fs.createReadStream(file);
  const csvParser = csvParse.parse({
    delimiter: ',',
    columns: true
  });
  const promise = pipeline(stream, csvParser);
  for await (const row of csvParser) {
    yield row;
  }
  await promise;
}

/**
 * NOAAStormEvents params.
 * @typedef {Object} NOAAStormEventsProps
 * @property {string} type Optional. Null for all; details, locations, or fatalities.
 * @property {boolean} suppressLogs Optional. When true, prevents logging to stdout.
 * @property {boolean} onlyNew Optional. Only process new entries.
 * @property {Function} cacher Optional. Replacement for the Info object.
 */

/**
 * Wraps all utility functions into one self-contained function.
 *
 * @param {NOAAStormEventsProps} props Properties to setup.
 * @param {boolean} _suppressLogs Deprecated. When true, prevents logging to stdout.
 */
async function* NOAAStormEvents(_props = {}, _suppressLogs = false) {
  let type = null;
  let suppressLogs = _suppressLogs;
  let props = _props || {};
  if ('string' === typeof props) {
    type = props;
    props = {};
  } else {
    ({
      type = null,
      suppressLogs = false
    } = props || {});
  }
  const {
    onlyNew = false,
    cacher = null
  } = props || {};
  if (cacher) {
    Info.replace(cacher);
  }
  const links = await PullLinks();
  if (onlyNew && 0 === links.length) {
    yield undefined;
    return;
  }
  let files = [];
  if (links.length > 0) {
    await DownloadFiles(links, suppressLogs);
    files = await ExtractCacheFiles(suppressLogs);
  } else {
    const cacheFiles = await getCacheFiles();
    files = cacheFiles.filter(x => x.match(/.csv$/));
  }
  if (type) {
    files = files.filter(f => f.includes(`StormEvents_${type}-`));
  }
  for (const file of files) {
    for await (const row of ReadCSV(file)) {
      yield row;
    }
  }
}

/**
 * Same as parent function, but only parses new downloads.
 *
 * @param {NOAAStormEventsProps} _props Properties to setup.
 * @param {boolean} _suppressLogs Deprecated. When true, prevents logging to stdout.
 */
NOAAStormEvents.onlyNew = function (_props = null, _suppressLogs = false) {
  let type = null;
  let suppressLogs = _suppressLogs;
  let props = _props || {};
  if ('string' === typeof props) {
    type = props;
    props = {};
  } else {
    ({
      type = null,
      suppressLogs = false
    } = props || {});
  }
  const passed = {
    type,
    suppressLogs,
    ...props,
    onlyNew: true
  };
  const inter = {
    [Symbol.asyncIterator]() {
      const main = NOAAStormEvents(passed);
      return {
        async next() {
          return await main.next();
        }
      };
    }
  };
  return inter;
};

exports.DownloadFiles = DownloadFiles;
exports.ExtractCacheFiles = ExtractCacheFiles;
exports.Info = Info;
exports.NOAAStormEvents = NOAAStormEvents;
exports.PullLinks = PullLinks;
exports.default = NOAAStormEvents;
exports.getCacheFiles = getCacheFiles;
