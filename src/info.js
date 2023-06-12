import fs from 'fs';
import path from 'path';

import getCacheFiles from './get-cache-files.js';

export default function Info() {}
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
