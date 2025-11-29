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
        <AsyncImage
          :src="getImageUrl(item.image.uuid)"
          :alt="item.image.prompt_simple"
          class="masonry-image"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { imagesApi } from '@api'
import AsyncImage from './AsyncImage.vue'

export default {
  name: 'MasonryModal',
  components: { AsyncImage },
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

    // BSP (Binary Space Partitioning) layout algorithm
    // Recursively subdivides the viewport to create a collage that fills all space
    const bspLayout = (images, rect) => {
      if (images.length === 0) return []

      // Base case: single image fills its rectangle
      if (images.length === 1) {
        return [{ image: images[0], rect }]
      }

      // Decide split direction based on rectangle shape
      const rectAspect = rect.width / rect.height
      const splitVertically = rectAspect >= 1 // wide rect = vertical split (side by side)

      // Calculate total aspect for proportional splitting
      const totalAspect = images.reduce((sum, img) => sum + img.aspect, 0)

      // Find optimal split point - aim for roughly equal visual weight
      let cumAspect = 0
      let splitIdx = 1

      for (let i = 0; i < images.length - 1; i++) {
        cumAspect += images[i].aspect
        const ratio = cumAspect / totalAspect
        // Find split point closest to 50%, but ensure at least 1 image per side
        if (ratio >= 0.4) {
          splitIdx = i + 1
          break
        }
      }

      const group1 = images.slice(0, splitIdx)
      const group2 = images.slice(splitIdx)

      // Calculate split position based on aspect ratios of each group
      const aspect1 = group1.reduce((s, img) => s + img.aspect, 0)
      const aspect2 = group2.reduce((s, img) => s + img.aspect, 0)

      let rect1, rect2

      if (splitVertically) {
        // Split left/right
        const ratio = aspect1 / (aspect1 + aspect2)
        const splitX = rect.x + rect.width * ratio
        rect1 = { x: rect.x, y: rect.y, width: rect.width * ratio, height: rect.height }
        rect2 = { x: splitX, y: rect.y, width: rect.width * (1 - ratio), height: rect.height }
      } else {
        // Split top/bottom
        const ratio = aspect1 / (aspect1 + aspect2)
        const splitY = rect.y + rect.height * ratio
        rect1 = { x: rect.x, y: rect.y, width: rect.width, height: rect.height * ratio }
        rect2 = { x: rect.x, y: splitY, width: rect.width, height: rect.height * (1 - ratio) }
      }

      // Recurse on both halves
      return [
        ...bspLayout(group1, rect1),
        ...bspLayout(group2, rect2)
      ]
    }

    // Main layout calculation using BSP treemap
    const calculateLayout = (images, vpWidth, vpHeight) => {
      if (!images || images.length === 0) return []

      const padding = 8
      const overlap = 2 // Slight overlap for seamless edges

      // Initial rectangle (full viewport minus padding)
      const initialRect = {
        x: padding,
        y: padding,
        width: vpWidth - padding * 2,
        height: vpHeight - padding * 2
      }

      // Prepare image data with aspect ratios
      const imageData = images.map(img => {
        const dims = extractDimensions(img)
        return {
          image: img,
          aspect: dims.width / dims.height
        }
      })

      // Run BSP layout algorithm
      const placements = bspLayout(imageData, initialRect)

      // Convert to positioned items with slight overlap for seamless appearance
      return placements.map(({ image, rect }) => ({
        image: image.image,
        style: {
          position: 'absolute',
          left: `${rect.x - overlap}px`,
          top: `${rect.y - overlap}px`,
          width: `${rect.width + overlap * 2}px`,
          height: `${rect.height + overlap * 2}px`
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

.masonry-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
