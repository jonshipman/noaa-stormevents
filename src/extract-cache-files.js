import fs from 'fs/promises';
import gunzip from 'gunzip-file';

import getCacheFiles from './get-cache-files.js';

/**
 * Extracts all the .gz files in the cache directory, returning the path of the
 * exports.
 *
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 * @return {string[]} File paths.
 */
export default async function ExtractCacheFiles(suppressLogs = false) {
	const cacheFiles = await getCacheFiles();

	let files = cacheFiles.filter((x) => x.match(/.csv.gz$/));

	const extracted = [];

	for (const file of files) {
		const newFile = file.replace(/.gz$/, '');

		if (files.includes(newFile)) {
			if (!suppressLogs) {
				console.log(newFile, 'exists\n  Extraction skipped');
			}

			try {
				await fs.unlink(file);
			} catch (e) {
				if (!suppressLogs) {
					console.error('Unable to delete', file);
				}
			}
			extracted.push(newFile);
			continue;
		}

		await (() => {
			return new Promise((resolve) => {
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
			await fs.unlink(file);
		} catch (e) {
			if (!suppressLogs) {
				console.error('Unable to delete', file);
			}
		}

		extracted.push(newFile);
	}

	return extracted;
}
