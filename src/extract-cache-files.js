import getCacheFiles from './get-cache-files.js';
import gunzip from 'gunzip-file';

/**
 * Extracts all the .gz files in the cache directory, returning the path of the
 * exports.
 *
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 * @return {string[]} File paths.
 */
export default async function ExtractCacheFiles(suppressLogs = false) {
	const files = await getCacheFiles();
	const extracted = [];

	for (const file of files) {
		const newFile = file.replace(/.gz$/, '');

		if (files.includes(newFile)) {
			if (!suppressLogs) {
				console.log(newFile, 'exists\n  Extraction skipped');
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

		extracted.push(newFile);
	}

	return extracted;
}
