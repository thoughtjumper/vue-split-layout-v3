<template>
  <div :class="['app', state.extraStyle?'extra':'']">
    <div class="controls">
      <button
        :class="{active:state.edit}"
        @click="toggleEdit">Toggle editable <span/></button>
      <button
        :class="{active:state.resize}"
        @click="toggleResize">Toggle resizeable <span/></button>
      <button
        :class="{active: state.edit && state.resize}"
        @click="toggleBoth">Toggle both</button>
      <button
        :class="{active:state.extraStyle}"
        @click="toggleStyle">Toggle Style</button>
      <button
        @click="changeSplits">Change layout</button>
      <button
        @click="addPane">+ Add Pane</button>
    </div>

    <Layout
      ref="layout"
      :edit="state.edit"
      :resize="state.resize"
      :splits="state.splits"
      @pane:added="onPaneAdded"
      @pane:removed="onPaneRemoved">

      <!--
        Static panes use index-based viewId (0..4).
        Dynamic panes use an explicit :key which becomes their viewId.
      -->
      <div class="nopane">
        <div>Also drag me<button>random button</button><ul><li>Random</li><li>list</li></ul><div>{{ state.edit }}</div></div>
      </div>
      <Pane title="Drag me">testing</Pane>
      <Pane title="Drag me too">Stuff<MyInput /></Pane>
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
        :title="pane.title">
        <div class="pane-body">
          <p>{{ pane.content }}</p>
          <button class="close-btn" @click.stop="removePane(pane.id)">✕ Close</button>
        </div>
      </Pane>

    </Layout>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { Layout, Pane } from '../src'
import '../src/style.css'

const MyInput = defineComponent({
  name: 'MyInput',
  data () {
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

let dynCounter = 1

export default {
  name: 'App',
  components: { Layout, Pane, MyInput },
  data () {
    return {
      state: {
        extraStyle: false,
        edit: true,
        resize: true,
        splits: layouts[0],
        layoutN: 0
      },
      // Dynamic panes: each entry has { id, title, content }
      // The id is used as the :key on the slot child, which becomes its viewId.
      dynamicPanes: []
    }
  },
  methods: {
    // ── layout controls ──────────────────────────────────────────
    changeSplits () {
      this.state.layoutN = (this.state.layoutN + 1) % layouts.length
      this.state.splits = layouts[this.state.layoutN]
    },
    toggleEdit ()   { this.state.edit   = !this.state.edit },
    toggleResize () { this.state.resize = !this.state.resize },
    toggleBoth () {
      if (this.state.edit || this.state.resize) {
        this.state.edit = this.state.resize = false
        return
      }
      this.state.edit = this.state.resize = true
    },
    toggleStyle () { this.state.extraStyle = !this.state.extraStyle },

    // ── dynamic pane management ───────────────────────────────────

    // Add a new pane: first push it into dynamicPanes so Vue renders
    // the slot child, then in the next tick call layout.addPane() so
    // the tree picks it up.
    addPane () {
      const id = 'dyn-' + dynCounter++
      const pane = {
        id,
        title: 'Pane ' + id,
        content: 'Dynamic pane — close with the button below.'
      }
      this.dynamicPanes.push(pane)

      // After Vue has rendered the new slot child into the staging area,
      // tell Layout to insert it into the visible tree next to viewId=1
      // (the "Drag me" pane) on the right.
      this.$nextTick(() => {
        // Find any currently visible view to attach next to.
        // Default: attach to the first visible view at position 1 (right).
        this.$refs.layout.addPane(id, undefined, 1, 50)
      })
    },

    // Remove pane: first remove it from the tree, then remove the slot child.
    removePane (id) {
      this.$refs.layout.removePane(id)
      const idx = this.dynamicPanes.findIndex(p => p.id === id)
      if (idx !== -1) this.dynamicPanes.splice(idx, 1)
    },

    // Layout events
    onPaneAdded (viewId)   { console.log('[layout] pane added:', viewId) },
    onPaneRemoved (viewId) { console.log('[layout] pane removed:', viewId) }
  }
}
</script>

<style lang="scss" src="./App.scss">
</style>

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
