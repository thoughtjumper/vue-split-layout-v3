# @edvanta/vue-split-layout-v3

A modern, high-performance Vue 3 port of the original [vue-split-layout](https://github.com/vue-hxs/vue-split-layout) by Luis Figueiredo.

This package provides a flexible, draggable, and resizable split layout system designed specifically for Vue 3, featuring zero runtime dependencies and a significantly reduced bundle size.

## 🚀 Quick Start

### Installation

```bash
npm install @edvanta/vue-split-layout-v3
```

### Basic Usage

```vue
<template>
  <Layout :splits="layout">
    <Pane title="Pane 1">Content 1</Pane>
    <Pane title="Pane 2">Content 2</Pane>
  </Layout>
</template>

<script setup>
import { Layout, Pane } from '@edvanta/vue-split-layout-v3'
import '@edvanta/vue-split-layout-v3/style.css'

const layout = {
  dir: 'horizontal',
  first: 0,
  second: 1
}
</script>
```

## 📺 Live Demo

You can view the live demo (Composition API) here:
👉 **[Live Demo](https://thoughtjumper.github.io/vue-split-layout-v3/)**
*(Note: The link above assumes GitHub Pages hosting. You can also run it locally: `npm run dev`)*

---

## 📖 Detailed Documentation

For advanced usage, including dynamic panes, Pinia integration, and Composition API examples, see the full documentation:

👉 **[View Full Documentation](./DOCUMENTATION.md)**

### Key Improvements in this Port
- **Vue 3 Native**: Rewritten to leverage Vue 3's high-performance reactivity system.
- **Vite Powered**: Uses Vite for lightning-fast development and optimized builds.
- **Zero Dependencies**: Removed `lodash` dependency, reducing bundle size from 34.3kB to **14.0kB**.
- **Fixed Core Bugs**: Addressed legacy bugs related to state cloning and fragment rendering.

## 📄 Credits
This project is a Vue 3 port of [vue-split-layout](https://github.com/vue-hxs/vue-split-layout) (NPM: [vue-split-layout](https://www.npmjs.com/package/vue-split-layout)). All original layout logic and design patterns belong to the original author.


## 📄 License
MIT © Edvanta

