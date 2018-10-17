import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import builtins from 'rollup-plugin-node-builtins';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import pkg from './package.json';

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const minify = () => (process.env.NODE_ENV === 'production' ? terser() : null);
const maps = () => (process.env.NODE_ENV !== 'production' ? sourcemaps() : null);

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'io',
      file: pkg.browser,
      format: 'umd',
    },
    external,
    plugins: [resolve(), commonjs({ browser: true }), typescript(), builtins(), minify(), maps()],
  },
  {
    input: 'src/index.ts',
    external,
    output: { file: pkg.main, format: 'cjs' },
    plugins: [resolve(), typescript(), minify(), maps()],
  },
  {
    input: 'src/index.ts',
    external,
    output: { file: pkg.module, format: 'es' },
    plugins: [resolve(), typescript(), minify(), maps()],
  },
];
