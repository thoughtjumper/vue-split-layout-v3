# @edvanta/vue-split-layout — Full Documentation

A modern, high-performance Vue 3 port of the original [vue-split-layout](https://github.com/vue-hxs/vue-split-layout). This guide covers installation, core concepts, advanced usage, and integration with Pinia.

---

## 1. Installation & Setup

### Install via NPM
```bash
npm install @edvanta/vue-split-layout
```

### Import Styles
You must import the structural CSS once in your project (usually in `main.js` or `App.vue`):

```javascript
import '@edvanta/vue-split-layout/style.css'
```

---

## 2. Basic Usage (Composition API)

The simplest way to use the layout is by providing a `splits` configuration and filling the slots with `Pane` components.

```vue
<template>
  <div style="height: 500px; width: 100%;">
    <Layout :splits="layoutConfig">
      <Pane title="Left Pane">
        <p>This is the left side.</p>
      </Pane>
      <Pane title="Right Pane">
        <p>This is the right side.</p>
      </Pane>
    </Layout>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Layout, Pane } from '@edvanta/vue-split-layout'

const layoutConfig = reactive({
  dir: 'horizontal', // 'horizontal' or 'vertical'
  split: '30%',      // Percentage of the first pane
  first: 0,          // Refers to the first slot child
  second: 1          // Refers to the second slot child
})
</script>
```

---

## 3. The Splits Configuration

The `splits` object defines how your layout is partitioned. It can be a simple ID or a nested object.

### ID Reference
If `splits` is a number or string (e.g., `0`), the Layout will render the slot child at that index.

### Split Object
A split object divides a region into two parts:
- `dir`: `'horizontal'` (side-by-side) or `'vertical'` (stacked).
- `split`: Percentage string (e.g., `'50%'`) for the first part.
- `first`: The content for the first part (can be another split object or an ID).
- `second`: The content for the second part (can be another split object or an ID).

---

## 4. Dynamic Pane Management (Add & Close)

To add and remove panes dynamically, you need to manage a list of data in your component and use the `Layout` component's imperative methods.

### How it works:
1.  **View IDs**: Every pane needs a `viewId`. By default, static panes are indexed `0, 1, 2...`. For dynamic panes, we use the `:key` attribute as the `viewId`.
2.  **Staging Area**: The Layout component renders all slot children in a hidden area first, then moves them into the visible split tree.

### Example: Composition API with `<script setup>`

```vue
<template>
  <div class="app-container">
    <div class="toolbar">
      <button @click="addNewPane">+ Add Pane</button>
    </div>

    <Layout ref="layoutRef" :splits="layout">
      <!-- Static Pane (viewId 0) -->
      <Pane title="Main View">
        Primary Content
      </Pane>

      <!-- Dynamic Panes -->
      <Pane v-for="p in dynamicPanes" :key="p.id" :title="p.title">
        <div class="content">
          {{ p.content }}
          <hr />
          <button @click="closePane(p.id)">✕ Close Pane</button>
        </div>
      </Pane>
    </Layout>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import { Layout, Pane } from '@edvanta/vue-split-layout'

const layoutRef = ref(null)
const dynamicPanes = ref([])
const layout = ref({
  dir: 'horizontal',
  first: 0,
  second: null // placeholder
})

const addNewPane = () => {
  const id = `pane-${Date.now()}`
  dynamicPanes.value.push({
    id,
    title: `Dynamic Pane ${id}`,
    content: 'Dynamically generated content'
  })

  // IMPORTANT: Wait for Vue to render the new slot child before adding to layout
  nextTick(() => {
    // addPane(newViewId, targetViewId, position, size)
    // position: 0=top, 1=right, 2=bottom, 3=left
    layoutRef.value.addPane(id, 0, 1, 50)
  })
}

const closePane = (id) => {
  // 1. Remove from the layout tree
  layoutRef.value.removePane(id)
  
  // 2. Remove from your data array to unmount the Pane
  const idx = dynamicPanes.value.findIndex(p => p.id === id)
  if (idx !== -1) dynamicPanes.value.splice(idx, 1)
}
</script>
```

---

## 5. Pinia Store Integration

Managing multiple layouts and persisting them is best handled with a central store like Pinia.

### Step 1: Define the Store
```javascript
// stores/layout.js
import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    // Store named layouts
    savedLayouts: {
      'Workspace A': { dir: 'horizontal', first: 0, second: 1 },
      'Workspace B': { dir: 'vertical', first: 1, second: 0 }
    },
    activeName: 'Workspace A'
  }),
  getters: {
    activeLayout: (state) => state.savedLayouts[state.activeName]
  },
  actions: {
    saveCurrent(config) {
      this.savedLayouts[this.activeName] = JSON.parse(JSON.stringify(config))
    },
    createNew(name) {
      this.savedLayouts[name] = { dir: 'horizontal', first: 0, second: 1 }
      this.activeName = name
    }
  }
})
```

### Step 2: Integrate in Component
```vue
<script setup>
import { useLayoutStore } from './stores/layout'
import { Layout, Pane } from '@edvanta/vue-split-layout'

const store = useLayoutStore()

// You can watch the layout object for changes to auto-save
// or save on specific events
const onLayoutComplete = () => {
  // Access internal state if needed
  // store.saveCurrent(layoutRef.value.state.nodes)
}
</script>

<template>
  <div class="manager">
    <div class="tabs">
      <button v-for="(l, name) in store.savedLayouts" 
              @click="store.activeName = name"
              :class="{ active: store.activeName === name }">
        {{ name }}
      </button>
    </div>

    <Layout :splits="store.activeLayout" @layout:complete="onLayoutComplete">
      <Pane title="File Explorer">...</Pane>
      <Pane title="Code Editor">...</Pane>
    </Layout>
  </div>
</template>
```

---

## 6. Imperative API

The `Layout` component provides several methods that can be accessed via a `ref`.

### `addPane(viewId, targetViewId, position, size)`
Adds a pane to the layout.
- `viewId`: The ID of the pane to add (must match a slot child's key).
- `targetViewId` (optional): The ID of an existing pane to split. If omitted, it targets the first visible pane.
- `position` (optional): `0` (top), `1` (right), `2` (bottom), `3` (left). Default is `1`.
- `size` (optional): Number (percentage, e.g., `30`). Default is `50`.

### `removePane(viewId)`
Removes a pane from the layout and merges the remaining space.
- `viewId`: The ID of the pane to remove.

---

## 7. Advanced Customization

### Draggable Handles
If you want to drag a pane from a specific area instead of the whole header, add the `pane-drag` attribute to any element inside the pane:

```html
<Pane title="My Pane">
  <div class="drag-handle" pane-drag>⠿ DRAG HERE</div>
  <div class="content">...</div>
</Pane>
```

### Custom Styling
The layout uses CSS Flexbox. You can customize the look by overriding these CSS classes:
- `.layout-container`: The root element.
- `.split`: The container for two split panes.
- `.splitter`: The interactive bar between panes.
- `.pane`: The wrapper for individual contents.

---

## 7. Credits & Acknowledgments
This package is a Vue 3 port of the original [vue-split-layout](https://github.com/vue-hxs/vue-split-layout) created by Luis Figueiredo.

We have optimized the codebase for Vue 3, removed heavy dependencies, and fixed several lifecycle-related bugs to ensure a smooth experience in modern applications.

**Original Package:** [vue-hxs/vue-split-layout](https://github.com/vue-hxs/vue-split-layout)  
**Original NPM:** [vue-split-layout](https://www.npmjs.com/package/vue-split-layout)  
**Original Author:** Luis Figueiredo

