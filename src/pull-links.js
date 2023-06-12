import got from 'got';

import { Config } from './config.js';
import Info from './info.js';

/**
 * Grabs all the StormEvents Links.
 *
 * @return {string[]} URIs.
 */
export default async function PullLinks() {
	let response;

	const history = await Info.readValue('history', []);

	try {
		response = await got(Config.url);
	} catch (e) {
		throw new Error(`${Config.url} is unreachable`);
	}

	if (!response) {
		throw new Error(`No response from ${Config.url}`);
	}

	const links = response.body
		.match(/<a[^>]*>([^<]+)<\/a>/g)
		.filter((x) => x.includes('.csv.gz'))
		.map((x) => {
			return x.match(/href="(.*?)"/)[1];
		})
		.map((a) => Config.url + '/' + a)
		.filter((a) => !history.includes(a));

	return links;
}
