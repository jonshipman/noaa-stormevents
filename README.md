# NOAA Storm Events

Parses the https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/ list of events and caches the results in a .cache directory. Provides an interator that you can use for getting the JSON. Errors are caught and ignored (typically CSV errors that prevent JSON parsing).

Example:

```
import NOAAStormEvents from 'noaa-stormevents';

async function NOAA() {
	for await (const result of NOAAStormEvents()) {
		console.log(result);
	}
}

NOAA();
```

## Options

``NOAAStormEvents`` takes two parameters, type``[0]`` and suppressLogs``[1]``. Type can be one of 'details', 'locations', or 'fatalities'. Supply null to loop over everything. If you supply true in the second spot, stdout logging will be suppressed.

## Exports

In addition to the default export, you also have access to the following:
* DownloadFiles
* ExtractCacheFiles
* getCacheFiles
* PullLinks
* WriteJSON

Useage would follow this pattern:
```
const links = await PullLinks();
await DownloadFiles(links, suppressLogs);

await ExtractCacheFiles();

const files = await WriteJSON(type, suppressLogs);
```

``getCacheFiles`` will only return the StormEvents_ files regardless of other files present in the .cache directory.

Repeated running of the function will not overwrite old files and will update with any changes made to https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/ while providing the same results.
