# Changelog
All notable changes will be documented here.

## [0.1.5] - 2022-05-03
### Added
- Info object can be replaced with the cacher prop on ``NOAAStormEvents`` or via ``Info.replace``.
- ``NOAAStormEvents`` now takes an object as the first prop. ``onlyNew`` has been rolled into the prop.
- csvtojson dropped for parse-csv. CSV files are retained instead of json files and are stream parsed as opposed to parsed in memory.

## [0.1.4] - 2022-02-18
### Added
- Info function for saving a history of downloaded files.
- Ability to set the cache path to a user defined location.
- Added ``NOAAStormEvents.onlyNew`` to only parse new files.
