import {defineConfig} from 'vite';
export default defineConfig({base:'./',esbuild:{jsx:'automatic'},build:{rollupOptions:{onwarn(warning,warn){if(warning.code==='MODULE_LEVEL_DIRECTIVE')return;warn(warning)}}}});
