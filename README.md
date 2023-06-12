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

__Note__:  
Commonjs exports are named. e.g.:

```
const { NOAAStormEvents } = require('noaa-stormevents');
```

## Options

``NOAAStormEvents`` takes one object parameter with the following properties:

* ``type``  
*Type can be one of 'details', 'locations', or 'fatalities'. Supply null to loop over everything.*

* ``suppressLogs``  
*If you supply true, stdout logging will be suppressed.*

* ``onlyNew``  
*Uses the cache as a reference and ignores anything already downloaded or in the history info report*

* ``cacher``  
*Pass an object as this property and every function inside [Info](./src/info.js) can be replaced. Useful if you want the history to be saved in a database instead of a filesystem.*

``getCacheFiles.setCachePath`` will allow you to change the cache path from .cache to any dir of your choosing. Must be set before running any of the other functions, otherwise .cache will be used/created.

## Exports

In addition to the default export, you also have access to the following:
* DownloadFiles
* ExtractCacheFiles
* getCacheFiles
* PullLinks
* WriteJSON
* Info

Useage would follow this pattern:
```
const links = await PullLinks();
await DownloadFiles(links, suppressLogs);

await ExtractCacheFiles();

const files = await WriteJSON(type, suppressLogs);
```

``getCacheFiles`` will only return the StormEvents_ files regardless of other files present in the .cache directory.

Repeated running of the function will not overwrite old files and will update with any changes made to https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/ while providing the same results.

If your filesystem is ephemeral, you can pass ``Info.replace(x)`` where ``x`` will be an object whose keys will replace the functions. You can replace all or some of the functions within to modify the storing and retrieval of the json cache. The filesystem must be used for the csv/json conversion.
