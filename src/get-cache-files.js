import fs from 'fs';
import path from 'path';

let cachefolderexists = false;

/**
 * Gets the paths to all the cached files.
 *
 * @return {string[]} File paths.
 */
export default async function getCacheFiles() {
	if (!cachefolderexists) {
		await CacheFolderEnsure();
	}

	const files = await fs.promises.readdir(getCacheFiles.cachepath);

	return files
		.filter((f) => f.includes('StormEvents_'))
		.map((f) => path.join(getCacheFiles.cachepath, f));
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
