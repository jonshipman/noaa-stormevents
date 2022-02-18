import got from 'got';
import { JSDOM } from 'jsdom';

import { Config } from '../config.js';
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

	const dom = new JSDOM(response.body);
	const links = [...dom.window.document.querySelectorAll('a')]
		.map((a) => a.href)
		.filter((a) => a.includes('.csv.gz'))
		.map((a) => Config.url + '/' + a)
		.filter((a) => !history.includes(a));

	return links;
}
