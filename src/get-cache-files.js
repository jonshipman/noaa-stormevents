import fs from 'fs/promises';
import path from 'path';

import { Config } from '../config.js';

/**
 * Gets the paths to all the cached files.
 *
 * @return {string[]} File paths.
 */
export default async function getCacheFiles() {
	const files = await fs.readdir(Config.cache);

	return files
		.filter((f) => f.includes('StormEvents_'))
		.map((f) => path.join(Config.cache, f));
}
