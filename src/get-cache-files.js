import fs from 'fs/promises';
import path from 'path';

import { Config } from '../config.js';

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

	const files = await fs.readdir(Config.cache);

	return files
		.filter((f) => f.includes('StormEvents_'))
		.map((f) => path.join(Config.cache, f));
}

/**
 * Creates the .cache folder.
 */
async function CacheFolderEnsure() {
	try {
		await fs.mkdir(Config.cache);
		cachefolderexists = true;
	} catch (e) {
		// Folder exists.
	}
}
