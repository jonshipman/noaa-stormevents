import csv from 'csvtojson';
import fs from 'fs/promises';

import getCacheFiles from './get-cache-files.js';

/**
 * Converts cached csv files into JSON. Supply the type to limit files to the
 * type. As of this writing, that includes just details, locations, and
 * fatalities.
 *
 * @param {string} type Optional. Null for all; details, locations, or
 *                      fatalities.
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 * @return {Array} Results.
 */
export default async function WriteJSON(type = null, suppressLogs = false) {
	const cacheFiles = await getCacheFiles();

	let files = cacheFiles.filter((x) => x.match(/.csv$/));

	if (type) {
		files = files.filter((f) => f.includes(`StormEvents_${type}-`));
	}

	const results = [];

	for (const file of files) {
		const newFile = file.replace(/.csv$/, '.json');

		if (cacheFiles.includes(newFile)) {
			if (!suppressLogs) {
				console.log('Skipping;', newFile, 'exists');
			}

			results.push(newFile);
			continue;
		}

		let json;

		try {
			json = await csv().fromFile(file);
		} catch (e) {
			if (!suppressLogs) {
				console.error(
					'\n\nError writing',
					newFile,
					'; CSV error as follows:',
					e.message
				);
			}
		}

		if (!json) {
			continue;
		}

		await fs.writeFile(newFile, JSON.stringify(json));

		if (!suppressLogs) {
			console.log(newFile, 'written');
		}

		results.push(newFile);
	}

	return results;
}
