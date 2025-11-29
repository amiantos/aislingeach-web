<template>
  <div v-if="show" class="masonry-overlay" @click.self="$emit('close')">
    <button class="btn-close" @click="$emit('close')" title="Close (Esc)">
      <i class="fa-solid fa-xmark"></i>
    </button>

    <div class="masonry-container" ref="containerRef">
      <div
        v-for="item in layout"
        :key="item.image.uuid"
        class="masonry-item"
        :style="item.style"
      >
        <img
          :src="getImageUrl(item.image.uuid)"
          :alt="item.image.prompt_simple"
          :style="{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center'
          }"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { imagesApi } from '@api'

export default {
  name: 'MasonryModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    images: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const containerRef = ref(null)
    const viewportWidth = ref(window.innerWidth)
    const viewportHeight = ref(window.innerHeight)

    // Extract width/height from image's full_request JSON
    const extractDimensions = (image) => {
      if (image.full_request) {
        try {
          const request = JSON.parse(image.full_request)
          const params = request.params || {}
          return {
            width: params.width || 512,
            height: params.height || 512
          }
        } catch (e) {
          return { width: 512, height: 512 }
        }
      }
      return { width: 512, height: 512 }
    }

    // Treemap layout using squarified algorithm
    const calculateLayout = (images, vpWidth, vpHeight) => {
      if (!images || images.length === 0) return []

      const padding = 16
      const gap = 2

      // Get image data with aspects and assign weights
      const imageData = images.map(img => {
        const dims = extractDimensions(img)
        const aspect = dims.width / dims.height
        return {
          image: img,
          aspect,
          // Weight based on area - all images get equal weight
          weight: 1
        }
      })

      const totalWeight = imageData.reduce((sum, img) => sum + img.weight, 0)

      // Recursive treemap subdivision
      const subdivide = (items, rect) => {
        if (items.length === 0) return []
        if (items.length === 1) {
          const item = items[0]
          return [{
            image: item.image,
            aspect: item.aspect,
            rect: {
              x: rect.x + gap / 2,
              y: rect.y + gap / 2,
              width: rect.width - gap,
              height: rect.height - gap
            }
          }]
        }

        // Determine split direction based on rect shape
        const isWide = rect.width > rect.height

        // Find best split point (try to make squares)
        const itemWeightSum = items.reduce((sum, img) => sum + img.weight, 0)
        let splitWeight = 0
        let splitIndex = 0
        let bestAspectRatio = Infinity

        for (let i = 0; i < items.length - 1; i++) {
          splitWeight += items[i].weight
          const ratio1 = splitWeight / itemWeightSum
          const ratio2 = 1 - ratio1

          // Calculate aspect ratios of resulting rects
          let aspect1, aspect2
          if (isWide) {
            aspect1 = (rect.width * ratio1) / rect.height
            aspect2 = (rect.width * ratio2) / rect.height
          } else {
            aspect1 = rect.width / (rect.height * ratio1)
            aspect2 = rect.width / (rect.height * ratio2)
          }

          // Prefer splits that create more square-ish regions
          const maxAspect = Math.max(aspect1, aspect2, 1/aspect1, 1/aspect2)
          if (maxAspect < bestAspectRatio) {
            bestAspectRatio = maxAspect
            splitIndex = i + 1
          }
        }

        const leftItems = items.slice(0, splitIndex)
        const rightItems = items.slice(splitIndex)
        const leftWeight = leftItems.reduce((sum, img) => sum + img.weight, 0)
        const splitRatio = leftWeight / itemWeightSum

        let leftRect, rightRect
        if (isWide) {
          const splitX = rect.x + rect.width * splitRatio
          leftRect = { x: rect.x, y: rect.y, width: rect.width * splitRatio, height: rect.height }
          rightRect = { x: splitX, y: rect.y, width: rect.width * (1 - splitRatio), height: rect.height }
        } else {
          const splitY = rect.y + rect.height * splitRatio
          leftRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height * splitRatio }
          rightRect = { x: rect.x, y: splitY, width: rect.width, height: rect.height * (1 - splitRatio) }
        }

        return [
          ...subdivide(leftItems, leftRect),
          ...subdivide(rightItems, rightRect)
        ]
      }

      // Start with viewport minus padding
      const startRect = {
        x: padding,
        y: padding,
        width: vpWidth - padding * 2,
        height: vpHeight - padding * 2
      }

      const cells = subdivide(imageData, startRect)

      // Convert to layout format
      return cells.map(cell => ({
        image: cell.image,
        style: {
          position: 'absolute',
          left: `${cell.rect.x}px`,
          top: `${cell.rect.y}px`,
          width: `${cell.rect.width}px`,
          height: `${cell.rect.height}px`
        }
      }))
    }

    // Computed layout based on current images and viewport
    const layout = computed(() => {
      if (!props.show || !props.images.length) return []
      return calculateLayout(props.images, viewportWidth.value, viewportHeight.value)
    })

    // Debounce utility
    const debounce = (fn, delay) => {
      let timeout
      return (...args) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => fn(...args), delay)
      }
    }

    // Handle resize
    const handleResize = debounce(() => {
      viewportWidth.value = window.innerWidth
      viewportHeight.value = window.innerHeight
    }, 1500)

    // Handle keyboard
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        emit('close')
      }
    }

    // Get image URL
    const getImageUrl = (uuid) => {
      return imagesApi.getImageUrl(uuid)
    }

    // Lifecycle
    onMounted(() => {
      window.addEventListener('resize', handleResize)
      window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('keydown', handleKeydown)
    })

    // Recalculate when modal opens
    watch(() => props.show, (newVal) => {
      if (newVal) {
        viewportWidth.value = window.innerWidth
        viewportHeight.value = window.innerHeight
      }
    })

    return {
      containerRef,
      layout,
      getImageUrl
    }
  }
}
</script>

<style scoped>
.masonry-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-modal, rgba(0, 0, 0, 0.95));
  z-index: var(--z-index-modal, 1000);
  display: flex;
  align-items: center;
  justify-content: center;
}

.masonry-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.masonry-item {
  overflow: hidden;
  border-radius: 4px;
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: var(--overlay-darker, rgba(0, 0, 0, 0.6));
  color: white;
  border-radius: 8px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: background 0.2s ease;
}

.btn-close:hover {
  background: var(--color-danger, #ef4444);
}

@media (max-width: 640px) {
  .btn-close {
    top: 0.5rem;
    right: 0.5rem;
    width: 36px;
    height: 36px;
  }
}
</style>
