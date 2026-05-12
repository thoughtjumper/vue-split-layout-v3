<template>
  <div :class="['app', state.extraStyle ? 'extra' : '']">
    <div class="controls">
      <button
        :class="{ active: state.edit }"
        @click="state.edit = !state.edit"
      >
        Toggle editable <span />
      </button>
      <button
        :class="{ active: state.resize }"
        @click="state.resize = !state.resize"
      >
        Toggle resizeable <span />
      </button>
      <button
        :class="{ active: state.edit && state.resize }"
        @click="toggleBoth"
      >
        Toggle both
      </button>
      <button
        :class="{ active: state.extraStyle }"
        @click="state.extraStyle = !state.extraStyle"
      >
        Toggle Style
      </button>
      <button @click="changeSplits">Change layout</button>
      <button @click="addPane">+ Add Pane</button>
    </div>

    <Layout
      ref="layoutRef"
      :edit="state.edit"
      :resize="state.resize"
      :splits="state.splits"
      @pane:added="onPaneAdded"
      @pane:removed="onPaneRemoved"
    >
      <!--
        Static panes use index-based viewId (0..4).
      -->
      <div class="nopane">
        <div>
          Also drag me
          <button>random button</button>
          <ul>
            <li>Random</li>
            <li>list</li>
          </ul>
          <div>{{ state.edit }}</div>
        </div>
      </div>
      <Pane title="Drag me">testing</Pane>
      <Pane title="Drag me too">
        Stuff
        <MyInput />
      </Pane>
      <Pane title="Third">Testing dynamic split</Pane>
      <div class="custom-drag">
        <div class="container">
          testing a drag handle
          <div class="drag-handle" pane-drag>DRAG HERE</div>
          test
        </div>
      </div>

      <!-- Dynamic panes — each has an explicit :key used as its viewId -->
      <Pane
        v-for="pane in dynamicPanes"
        :key="pane.id"
        :title="pane.title"
      >
        <div class="pane-body">
          <p>{{ pane.content }}</p>
          <button class="close-btn" @click.stop="removePane(pane.id)">✕ Close</button>
        </div>
      </Pane>
    </Layout>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, defineComponent } from 'vue'
import { Layout, Pane } from '../src'
import '../src/style.css'

const MyInput = defineComponent({
  name: 'MyInput',
  data() {
    return { value: '' }
  },
  template: `<div><div>{{value}}</div><input type='text' v-model='value'></div>`
})

const layouts = [
  {
    dir: 'horizontal',
    first: {
      dir: 'vertical',
      first: 0,
      second: 2
    },
    second: {
      dir: 'horizontal',
      first: 4,
      second: 1
    }
  },
  {
    dir: 'horizontal',
    first: {
      dir: 'vertical',
      first: { dir: 'horizontal', first: 0, second: 3, split: '20%' },
      second: 2
    },
    second: 1
  }
]

const layoutRef = ref(null)
const dynamicPanes = ref([])
let dynCounter = 1

const state = reactive({
  extraStyle: false,
  edit: true,
  resize: true,
  splits: layouts[0],
  layoutN: 0
})

const toggleBoth = () => {
  if (state.edit || state.resize) {
    state.edit = state.resize = false
  } else {
    state.edit = state.resize = true
  }
}

const changeSplits = () => {
  state.layoutN = (state.layoutN + 1) % layouts.length
  state.splits = layouts[state.layoutN]
}

const addPane = () => {
  const id = 'dyn-' + dynCounter++
  const pane = {
    id,
    title: 'Pane ' + id,
    content: 'Dynamic pane — close with the button below.'
  }
  dynamicPanes.value.push(pane)

  nextTick(() => {
    // Attach to the tree next to the first visible view
    layoutRef.value.addPane(id, undefined, 1, 50)
  })
}

const removePane = (id) => {
  layoutRef.value.removePane(id)
  const idx = dynamicPanes.value.findIndex((p) => p.id === id)
  if (idx !== -1) dynamicPanes.value.splice(idx, 1)
}

const onPaneAdded = (viewId) => console.log('[layout] pane added:', viewId)
const onPaneRemoved = (viewId) => console.log('[layout] pane removed:', viewId)
</script>

<style lang="scss" src="./App.scss"></style>

<style scoped>
.pane-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}

.close-btn {
  align-self: flex-start;
  padding: 4px 10px;
  background: rgba(200, 60, 60, 0.85);
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  pointer-events: initial;
}

.close-btn:hover {
  background: rgba(200, 60, 60, 1);
}
</style>
