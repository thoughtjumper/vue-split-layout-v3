<script>
import { h } from 'vue'

export default {
  props: {
    resizeable: {type: Boolean, default: false},
    dir: {type: String, default: 'horizontal'},
    split: {type: [String, Number], default: '50%'}
  },
  data () {
    return {
      state: {
        resizing: false,
        split: this.split || '50%'
      }
    }
  },
  watch: {
    // Keep internal split state in sync when the prop changes from outside
    split (val) {
      this.state.split = val || '50%'
    }
  },
  computed: {
    splitClass () {
      return [
        'split',
        this.dir,
        this.state.resizing ? 'resizing' : '',
        this.resizeable ? 'resizeable' : ''
      ]
    }
  },

  methods: {
    startResize (event) {
      if (!this.resizeable || event.button !== 0) return
      event.stopPropagation()
      event.preventDefault()
      this.state.resizing = true

      const drag = (event) => {
        if (event.button !== 0) return
        const isH = this.dir === 'horizontal'
        var splitter = (isH ? this.$el.children[1].clientWidth : this.$el.children[1].clientHeight) / 2
        var parentRect = this.$el.getBoundingClientRect()
        var splitSize = isH
          ? (event.x - parentRect.left - splitter) / this.$el.clientWidth * 100
          : (event.y - parentRect.top - splitter) / this.$el.clientHeight * 100
        this.state.split = splitSize + '%'
        this.$emit('splitResize', event, this, this.state.split)
      }
      const drop = (event) => {
        if (event.button !== 0) return
        this.state.resizing = false
        document.removeEventListener('mousemove', drag)
        document.removeEventListener('mouseup', drop)
      }
      document.addEventListener('mousemove', drag)
      document.addEventListener('mouseup', drop)
    }
  },

  render () {
    // Vue 3 render: h is imported, not passed as argument.
    // Layout passes children via v-slots so default() returns the VNode array directly.
    const slots = this.$slots.default ? this.$slots.default() : []
    const items = []
    items.push(h('div', {class: 'content', style: 'flex-basis:' + this.state.split}, [slots[0]]))
    items.push(h('div', {class: 'splitter', onMousedown: this.startResize}))
    items.push(h('div', {class: 'content'}, [slots[1]]))
    return h('div', {class: this.splitClass}, items)
  }
}
</script>
<style>
.split {
  display: flex;
  flex: 1;
  height: 100%;
}

.split > .content {
  position: relative;
  display: flex;
  box-sizing: border-box;
  overflow: hidden;
}

.split > .content > * {
  flex: 1;
  height: 100%;
}

.split > .content:last-child {
  flex: 1;
}

.split > .splitter {
  flex-basis: 6px;
}

.split.vertical {
  flex-direction: column;
}

.split.horizontal {
  flex-direction: row;
}

.split.resizeable.vertical > .splitter {
  cursor: row-resize;
}

.split.resizeable.horizontal > .splitter {
  cursor: col-resize;
}
</style>
