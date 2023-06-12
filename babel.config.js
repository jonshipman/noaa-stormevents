module.exports = function (api) {
	api.cache(true);

	return {
		presets: [
			[
				'@babel/preset-env',
				{
					targets: {
						node: 10,
					},
					modules: false,
				},
			],
		],
		plugins: [
			'transform-import-meta',
			[
				'search-and-replace',
				{
					rules: [
						{
							search: /node:/,
							replace: '',
						},
					],
				},
			],
		],
	};
};
