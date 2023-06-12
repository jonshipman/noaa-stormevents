import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';

export default {
	input: 'src/index.js',
	output: {
		dir: 'cjs',
		format: 'cjs',
		exports: 'named',
	},
	external: ['csv-parse', 'gunzip-file'],
	plugins: [
		commonjs(),
		nodeResolve({
			exportConditions: ['node'],
			browser: false,
			preferBuiltins: false,
		}),
		json(),
		babel({
			babelHelpers: 'bundled',
		}),
	],
};
