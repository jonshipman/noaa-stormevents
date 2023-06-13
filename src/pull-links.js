import https from 'https';

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

	const url = new URL(Config.url);

	try {
		response = await new Promise((resolve, reject) => {
			const options = {
				host: url.host,
				path: url.pathname,
				port: 443,
				method: 'GET',
				headers: {},
			};

			const request = https.request(options, function (_response) {
				_response.setEncoding('utf8');

				let body = '';
				_response.on('data', (chunk) => {
					body = body + chunk;
				});

				_response.on('end', () => {
					if (_response.statusCode !== 200) {
						reject({ code: _response.statusCode, message: body });
					} else {
						resolve(body);
					}
				});
			});

			request.on('error', (e) => {
				reject(e);
			});

			request.end();
		});
	} catch (e) {
		throw new Error('object' === typeof e ? JSON.stringify(e) : e);
	}

	if (!response) {
		throw new Error(`No response from ${Config.url}`);
	}

	const links = response
		.match(/<a[^>]*>([^<]+)<\/a>/g)
		.filter((x) => x.includes('.csv.gz'))
		.map((x) => {
			return x.match(/href="(.*?)"/)[1];
		})
		.map((a) => Config.url + '/' + a)
		.filter((a) => !history.includes(a));

	return links;
}
