import DownloadFiles from './download-files.js';
import ExtractCacheFiles from './extract-cache-files.js';
import getCacheFiles from './get-cache-files.js';
import Info from './info.js';
import PullLinks from './pull-links.js';
import ReadCSV from './read-csv.js';

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
export default async function* NOAAStormEvents(
	_props = {},
	_suppressLogs = false
) {
	let type = null;
	let suppressLogs = _suppressLogs;
	let props = _props || {};

	if ('string' === typeof props) {
		type = props;
		props = {};
	} else {
		({ type = null, suppressLogs = false } = props || {});
	}

	const { onlyNew = false, cacher = null } = props || {};

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

		files = cacheFiles.filter((x) => x.match(/.csv$/));
	}

	if (type) {
		files = files.filter((f) => f.includes(`StormEvents_${type}-`));
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
		({ type = null, suppressLogs = false } = props || {});
	}

	const passed = { type, suppressLogs, ...props, onlyNew: true };

	const inter = {
		[Symbol.asyncIterator]() {
			const main = NOAAStormEvents(passed);

			return {
				async next() {
					return await main.next();
				},
			};
		},
	};

	return inter;
};
