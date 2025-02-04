import {defineConfig} from '@junobuild/config';

/** @type {import('@junobuild/config').JunoConfig} */
export default defineConfig({
  satellite: {
    id: 'd4l7a-yiaaa-aaaal-ar5dq-cai',
    source: 'dist',
    predeploy: ['npm run build']
  }
});
