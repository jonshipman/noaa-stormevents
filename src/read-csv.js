import { parse } from 'csv-parse';
import filesystem from 'fs';
import stream from 'stream';
import util from 'util';

const pipeline = util.promisify(stream.pipeline);

/**
 * Reads a csv file line by line returning json for the row.
 */
export default async function* ReadCSV(file) {
	const stream = filesystem.createReadStream(file);
	const csvParser = parse({ delimiter: ',', columns: true });
	const promise = pipeline(stream, csvParser);

	for await (const row of csvParser) {
		yield row;
	}

	await promise;
}
