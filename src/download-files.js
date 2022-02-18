import fsLegacy from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

import getCacheFiles from './get-cache-files.js';
import Info from './info.js';

/**
 * Downloads files (links) to the cache directory.
 *
 * @param {string[]} links Resolvable HTTP links.
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 */
export default async function DownloadFiles(links, suppressLogs = false) {
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

		history.push(link);
		files.push(filepath);
	}

	await Info.writeValue('history', [...new Set(history)]);
	return files;
}
