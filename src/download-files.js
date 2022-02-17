import fsLegacy from 'fs';
import fs from 'fs/promises';
import http from 'http';
import https from 'https';
import path from 'path';

import { Config } from '../config.js';
import getCacheFiles from './get-cache-files.js';

/**
 * Downloads files (links) to the cache directory.
 *
 * @param {string[]} links Resolvable HTTP links.
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 */
export default async function DownloadFiles(links, suppressLogs = false) {
	await CacheFolderEnsure();
	const files = [];

	const cachedFiles = await getCacheFiles();

	for (const link of links) {
		let filename = link.substring(link.lastIndexOf('/') + 1);
		const filepath = path.join(Config.cache, filename);

		if (cachedFiles.includes(filepath)) {
			files.push(filepath);
			continue;
		}

		const file = fsLegacy.createWriteStream(filepath);

		const protocol = 0 === link.indexOf('https') ? https : http;

		if (!suppressLogs) {
			console.log('Downloading', link, '\n');
		}

		await (() => {
			return new Promise((resolve, reject) => {
				protocol.get(link, (res) => {
					res.pipe(file);

					file.on('finish', () => {
						file.close(resolve);
					});

					file.on('error', () => {
						reject();
					});
				});
			});
		})();

		if (!suppressLogs) {
			console.log('Wrote', filepath, '\n');
		}

		files.push(filepath);
	}

	return files;
}

/**
 * Creates the .cache folder.
 */
export async function CacheFolderEnsure() {
	try {
		await fs.mkdir(Config.cache);
	} catch (e) {
		// Folder exists.
	}
}
