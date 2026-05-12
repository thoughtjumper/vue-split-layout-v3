import Split from './Split'
import Tree from './tree'
// Remove lodash cloneDeep since we will use our own tree clone function
import { toRaw } from 'vue'
import './Layout.css'

//  This is a conversion that was made from purejs to react and now in vue
//
// I know its not ideal to mess with the DOM, but it doesn't seem to exist a
// clean way to reparent components in react/vue without losing DOM state.
// My objective here was keep updating views either in DOM (e.g input box) or
// simple on a component as shown on <Clock /> example
//
// How this works:
//  * we receive a list of components that can be usable as views
//  * The state contains a tree with nodes pointing to the viewId
//  * render() will render all views inside a hidden DOM element with
// specific DOM properties and will render the tree elements with designated
// props
//  * componentDidUpdate, componentDidMount grab all views from hidden element
//  and place it on respective tree components as soon as we render(again) the
//  view components are moved back to the original place
//

// DOM
function checkAttach (targetDom, e, amount) {
  amount = amount || 33
  var size = amount / 100

  var trect = targetDom.getBoundingClientRect()
  var tW = trect.width * size
  var tH = trect.height * size
  var rPos = {x: e.clientX - trect.left, y: e.clientY - trect.top}

  // Calc dists and check the closest one
  var pos = [
    rPos.y - tH,
    (trect.width - tW) - rPos.x,
    (trect.height - tH) - rPos.y,
    rPos.x - tW
  ]
  // only matches if less than 0
  var min = 0
  var minI = -1
  pos.forEach((v, i) => {
    if (v < min) {
      min = v
      minI = i
    }
  })
  return minI
}

// Deep clone function specifically for the flat Tree structure.
// Safely preserves object identity for the `parent` pointers without Proxy issues.
function cloneTreeNodes (nodes) {
  const cloned = nodes.map(n => ({ ...toRaw(n) }))
  for (const node of cloned) {
    if (node.parent) {
      node.parent = cloned.find(n => n.id === node.parent.id)
    }
  }
  return cloned
}

// Vue 3: plain component options object (no Vue.component global registration)
export default {
  name: 'Layout',
  props: {
    'edit': {type: Boolean, default: true},
    'resize': {type: Boolean, default: true},
    'splits': {type: [String, Number, Object], default: () => ({})}
  },
  data () {
    return {
      state: {
        nodes: this.calcSplits()
      },
      // Active drag (null when not dragging). Declared here so it's reactive
      // and accessible during render without Vue 3 warnings.
      drag: null
    }
  },
  watch: {
    splits () {
      this.state.nodes = this.calcSplits()
    }
  },
  mounted () {
    // Initial reparenting: move slot children from the hidden staging area
    // into the visible [target-view] containers.
    this.reparentToTargets()
  },
  updated () {
    // After every re-render, move children from staging back into targets.
    this.reparentToTargets()
  },
  beforeUpdate () {
    // Before re-render, move children back to staging so Vue's diff sees
    // the staging area populated (matching the VDOM) and leaves targets empty.
    if (!this.$refs.container) { return }
    var els = this.$refs.container.querySelectorAll('[target-view]')
    Array.from(els).forEach((e) => {
      if (!e.children[0]) return
      var el = this.$refs.container.querySelector('[src-view="' + e.getAttribute('target-view') + '"]')
      if (el) el.appendChild(e.children[0])
    })
  },
  methods: {
    // Move slot children from the hidden [src-view] staging area into the
    // visible [target-view] containers. Called after mount and after every
    // update.
    reparentToTargets () {
      if (!this.$refs.container) return
      this.$emit('layout:begin')
      const els = this.$refs.container.querySelectorAll('[target-view]')
      Array.from(els).forEach((e) => {
        const targetName = e.getAttribute('target-view')
        const srcView = this.$refs.container.querySelector('[src-view="' + targetName + '"]')
        if (!srcView) return
        if (!srcView.children[0]) return
        e.appendChild(srcView.children[0])
      })
      this.$emit('layout:complete')
    },
    // Transform input into internal format
    calcSplits () {
      const root = []
      const tree = Tree.from(root)
      const walk = (node) => {
        // See node check if object or viewId
        if (node instanceof Object) {
          let split = tree.push({type: 'split', dir: node.dir, split: node.split})
          walk(node.first).parent = split
          walk(node.second).parent = split
          return split
        }
        return tree.push({type: 'view', viewId: node})
      }
      walk(this.splits)

      return root
    },
    onSplitResize (e, split, size) {
      // split is the Split component instance (this) passed via $emit.
      // node-id is not a declared prop on Split so it lives in $attrs.
      const nodeId = parseInt(split.$attrs['node-id'], 10)
      const node = Tree.from(this.state.nodes).findById(nodeId)
      if (node) {
        node.split = size
      }
    },

    // ─── Public API ──────────────────────────────────────────────────────────

    // Add a pane (identified by viewId) to the layout, placed next to
    // targetViewId at the given position (0=top 1=right 2=bottom 3=left).
    // size: percentage the new pane takes (default 50).
    // If targetViewId is omitted the pane is added next to the first view.
    addPane (viewId, targetViewId, position, size) {
      const tree = Tree.from(this.state.nodes)
      // Resolve target: find by viewId or fall back to the first view node
      let target = targetViewId !== undefined
        ? tree.findByViewId(targetViewId)
        : this.state.nodes.find(n => n.type === 'view')
      if (!target) {
        // Tree is empty — just push a single root view node
        const node = tree.push({ type: 'view', viewId })
        this.$emit('pane:added', viewId)
        return node
      }
      const added = tree.addByViewId(viewId, target.viewId, position, size)
      this.$emit('pane:added', viewId)
      return added
    },

    // Remove a pane by viewId. Returns true if removed.
    removePane (viewId) {
      const tree = Tree.from(this.state.nodes)
      const removed = tree.removeByViewId(viewId)
      if (removed) {
        this.$emit('pane:removed', viewId)
      }
      return removed
    },
    previewPane (attach, targetDom, amount) {
      if (attach === -1) {
        this.$refs.preview.style.opacity = 0
        return
      }
      if (targetDom === undefined) {
        return -1
      }
      amount = amount || 33 // default 33%
      const size = amount / 100

      // Precalc styles
      const targetRect = targetDom.getBoundingClientRect()
      const previewPos = {
        left: targetRect.left,
        top: targetRect.top,
        width: targetRect.width,
        height: targetRect.height
      }

      if (attach === 1) {
        previewPos.left += previewPos.width - previewPos.width * size
      } else if (attach === 2) {
        previewPos.top += previewPos.height - previewPos.height * size
      }
      if ((attach % 2) === 0) {
        previewPos.height *= size
      } else if ((attach % 2) === 1) {
        previewPos.width *= size
      }
      // Update DOM style
      this.$refs.preview.style.opacity = 1
      this.$refs.preview.style.position = 'fixed'
      for (const k in previewPos) {
        this.$refs.preview.style[k] = previewPos[k] + 'px'
      }
    },
    onViewDragStart (e) {
      if (e.button !== 0) return

      const nodeIdAttr = e.target.hasAttribute('node-id')
      const dragAttr = e.target.hasAttribute('pane-drag')
      if (!nodeIdAttr && !dragAttr) return

      var el = e.target
      if (!nodeIdAttr) { // Find parent with node-id attr
        var viewDom = el
        for (; viewDom && viewDom.matches && !viewDom.hasAttribute('node-id'); viewDom = viewDom.parentNode) {}
        if (!viewDom || !viewDom.matches) {
          return
        }
        el = viewDom
      }

      const nodeId = parseInt(el.getAttribute('node-id'), 10)
      if (nodeId === undefined) {
        return
      }

      const node = this.state.nodes.find(n => { return n.id === nodeId })
      if (node === undefined) {
        return
      }
      e.preventDefault()
      e.stopPropagation()

      const containerRect = this.$refs.container.getBoundingClientRect()
      const trect = e.target.getBoundingClientRect()

      this.drag = {
        node: node,
        offset: {x: e.clientX - trect.left, y: e.clientY - trect.top}
      }
      // Use custom clone function to preserve parent pointer references cleanly
      this.state.savedNodes = cloneTreeNodes(this.state.nodes)
      Tree.from(this.state.nodes).removeChild(node)

      // Direct DOM because its faster and we don't need state
      this.$refs.drag.style.top = (trect.y - containerRect.top) + 'px'
      this.$refs.drag.style.left = (trect.x - containerRect.left) + 'px'
      this.$refs.drag.style.width = trect.width + 'px'
      this.$refs.drag.style.height = trect.height + 'px'

      document.addEventListener('mousemove', this.onViewDrag)
      document.addEventListener('mouseup', this.onViewDrop)
    },

    onViewDrag (e) {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      this.drag.over = null // reset over

      const containerRect = this.$refs.container.getBoundingClientRect()
      const rel = {
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top
      }
      // move drag ghost
      this.$refs.drag.style.left = (rel.x - this.drag.offset.x) + 'px'
      this.$refs.drag.style.top = (rel.y - this.drag.offset.y) + 'px'

      // Disable drag temporarily to get element below
      this.$refs.drag.style.pointerEvents = 'none'
      var el = document.elementFromPoint(e.clientX, e.clientY)
      this.$refs.drag.style.pointerEvents = null

      // find parent view element
      var viewDom = el
      for (; viewDom && viewDom.matches && !viewDom.matches('.view'); viewDom = viewDom.parentNode) {}
      if (!viewDom || !viewDom.matches) {
        this.previewPane(-1)
        return
      }

      var attach = checkAttach(viewDom, e)
      if (attach !== -1) {
        this.drag.over = {viewDom, attach}
      }
      this.previewPane(attach, viewDom)
    },
    onViewDrop (e) {
      if (e.button !== 0) return
      document.removeEventListener('mousemove', this.onViewDrag)
      document.removeEventListener('mouseup', this.onViewDrop)
      // reset drag styling
      this.$refs.drag.style.right = this.$refs.drag.style.bottom =
        this.$refs.drag.style.left = this.$refs.drag.style.width =
        this.$refs.drag.style.height = 0

      this.previewPane(-1)
      if (this.drag.over == null) {
        this.drag = null
        this.state.nodes = this.state.savedNodes // rollback
        return
      }
      var {viewDom, attach} = this.drag.over
      var nodeId = parseInt(viewDom.getAttribute('node-id'), 10)
      var tree = Tree.from(this.state.nodes)
      var node = tree.findById(nodeId)
      tree.attachChild(node, attach, this.drag.node)
      this.drag = null
    }
  },

  render () {
    // Reparenting is handled by mounted() and updated() hooks — render
    // function should remain pure.

    // Layout renderer — recursively builds VNode tree from flat node array
    const walk = (node) => {
      switch (node.type) {
        case 'split': {
          const children = Tree.from(this.state.nodes).childrenOf(node).map(k => walk(k))
          // Pass children via the explicit `default` slot function so Vue 3
          // delivers them as a true VNode array (not wrapped in a fragment).
          return (
            <Split
              key={node.id}
              node-id={node.id}
              resizeable={this.resize}
              dir={node.dir}
              split={node.split}
              onSplitResize={this.onSplitResize}
              v-slots={{ default: () => children }}
            />
          )
        }
        default:
          if (this.edit) {
            return (<div class={'view'} node-id={node.id} target-view={'view-' + node.viewId} onMousedown={this.onViewDragStart}></div>)
          }
          return (<div class={'view'} node-id={node.id} target-view={'view-' + node.viewId}></div>)
      }
    }

    const tree = this.state.nodes[0] ? walk(this.state.nodes[0]) : null
    const layoutClass = [
      'layout-container',
      this.edit ? 'edit' : ''
    ]

    // Vue 3: $slots.default is a function, not an array.
    // Flatten Fragment VNodes (e.g. produced by v-for) so dynamically added
    // children are seen as individual slot entries.
    const rawSlots = this.$slots.default ? this.$slots.default() : []
    const flatten = (nodes) => {
      const out = []
      for (const v of nodes) {
        if (!v) continue
        // A Fragment VNode has type === Fragment (a Symbol) and its children
        // is an array of the actual VNodes (e.g. v-for output).
        if (typeof v.type === 'symbol' && Array.isArray(v.children)) {
          out.push(...flatten(v.children))
        } else if (v.type !== undefined && typeof v.type !== 'symbol') {
          // Real element/component VNode
          out.push(v)
        }
        // else: text/comment VNodes are dropped
      }
      return out
    }
    const slotNodes = flatten(rawSlots)

    return (
      <div class={layoutClass.join(' ')} ref="container">
        <div class={'views ' + (this.drag ? 'dragging' : '')} ref="views">
          {tree}
        </div>
        <div class="preview" ref="preview"></div>
        <div
          class={'drag ' + (this.drag ? 'dragging' : '')}
          ref="drag"
          style={{'transformOrigin': this.drag ? (this.drag.offset.x + 'px ' + this.drag.offset.y + 'px') : ''}}>
          {
            this.drag &&
            <div
              class="view"
              target-view={'view-' + this.drag.node.viewId}
            />
          }
        </div>
        <div style={{display: 'none'}}>
          {slotNodes.map((view, i) => {
            return (<div key={view.key || i} src-view={'view-' + (view.key || i)}>{view}</div>)
          })}
        </div>
      </div>
    )
  }
}
