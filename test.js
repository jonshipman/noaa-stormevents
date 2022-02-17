import DownloadFiles from './src/download-files.js';
import ExtractCacheFiles from './src/extract-cache-files.js';
import getCacheFiles from './src/get-cache-files.js';
import NOAAStormEvents from './src/noaa-stormevents.js';
import PullLinks from './src/pull-links.js';
import WriteJSON from './src/write-json.js';

// Pulls in the URLS.
async function TestUrls() {
	const links = await PullLinks();

	console.log(links);
}

if ('1' === process.argv[2]) {
	TestUrls();
}

// Downloads the files to the cache directory.
async function TestDownloads() {
	const links = await PullLinks();

	const files = await DownloadFiles(links);

	console.log(files);
}

if ('2' === process.argv[2]) {
	TestDownloads();
}

// Checks the cache dir contents.
async function TestCacheDir() {
	const files = await getCacheFiles();

	console.log(files);
}

if ('3' === process.argv[2]) {
	TestCacheDir();
}

// Extracts the cached files.
async function TestExtraction() {
	const files = await ExtractCacheFiles();

	console.log(files);
}

if ('4' === process.argv[2]) {
	TestExtraction();
}

// Extracts the cached files.
async function TestJSON() {
	const results = await WriteJSON(process.argv[3]);

	console.log(results);
}

if ('5' === process.argv[2]) {
	TestJSON();
}

// Tests whole process.
async function TestNOAA() {
	for await (const result of NOAAStormEvents(process.argv[3])) {
		console.log(result);
	}
}

if ('6' === process.argv[2]) {
	TestNOAA();
}
