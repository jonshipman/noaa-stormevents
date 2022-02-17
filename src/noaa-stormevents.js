import fs from 'fs/promises';

import DownloadFiles from './download-files.js';
import ExtractCacheFiles from './extract-cache-files.js';
import PullLinks from './pull-links.js';
import WriteJSON from './write-json.js';

/**
 * Wraps all utility functions into one self-contained function.
 *
 * @param {string} type Optional. Null for all; details, locations, or
 *                      fatalities.
 * @param {boolean} suppressLogs When true, prevents logging to stdout.
 */
export default async function* NOAAStormEvents(
	type = null,
	suppressLogs = false
) {
	const links = await PullLinks();
	await DownloadFiles(links, suppressLogs);

	await ExtractCacheFiles(suppressLogs);

	const files = await WriteJSON(type, suppressLogs);

	for (const file of files) {
		const contents = await fs.readFile(file);

		if (contents) {
			let json;

			try {
				json = JSON.parse(contents);
			} catch (e) {
				if (!suppressLogs) {
					console.error(
						'Unable to read',
						file,
						'; Error as follows:',
						e.message
					);
				}
			}

			if (json) {
				for (const item of json) {
					yield item;
				}
			}
		}
	}
}
