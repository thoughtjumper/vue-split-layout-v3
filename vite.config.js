import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'lib') {
    // Library build → dist/
    return {
      plugins: [vue(), vueJsx()],
      resolve: {
        extensions: ['.js', '.jsx', '.vue', '.json']
      },
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.js'),
          name: 'VueSplitLayout',
          fileName: (format) =>
            format === 'es'
              ? 'vue-split-layout.es.js'
              : 'vue-split-layout.js',
          formats: ['es', 'cjs']
        },
        rollupOptions: {
          // Exclude Vue from the bundle — consumers provide it
          external: ['vue'],
          output: {
            globals: { vue: 'Vue' }
          }
        },
        sourcemap: true,
        outDir: 'dist'
      }
    }
  }

  // Demo build / dev server
  return {
    base: '/vue-split-layout-v3/',
    plugins: [vue(), vueJsx()],
    resolve: {
      extensions: ['.js', '.jsx', '.vue', '.json']
    },
    root: '.',
    build: {
      outDir: 'docs',
      sourcemap: true
    }
  }
})
