<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="btn-close" @click="$emit('close')">×</button>

      <div class="image-container">
        <img :src="imageUrl" :alt="image.prompt_simple" />
      </div>

      <div class="image-details">
        <div v-if="image.prompt_simple" class="detail-row">
          <strong>Prompt:</strong>
          <p>{{ image.prompt_simple }}</p>
        </div>

        <div class="detail-row">
          <strong>Created:</strong>
          <p>{{ formatDate(image.date_created) }}</p>
        </div>

        <div v-if="image.backend" class="detail-row">
          <strong>Backend:</strong>
          <p>{{ image.backend }}</p>
        </div>

        <div class="actions">
          <a :href="imageUrl" :download="`aislingeach-${image.uuid}.png`" class="btn btn-download">
            Download
          </a>
          <button @click="$emit('delete', image.uuid)" class="btn btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { imagesApi } from '../api/client.js'

export default {
  name: 'ImageModal',
  props: {
    image: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'delete'],
  setup(props) {
    const imageUrl = computed(() => {
      return imagesApi.getImageUrl(props.image.uuid)
    })

    const formatDate = (timestamp) => {
      const date = new Date(timestamp)
      return date.toLocaleString()
    }

    return {
      imageUrl,
      formatDate
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  position: relative;
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 2rem;
  line-height: 1;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
}

.btn-close:hover {
  background: rgba(0, 0, 0, 0.95);
}

.image-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: auto;
  min-height: 0;
}

.image-container img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-details {
  padding: 1.5rem;
  background: #1a1a1a;
  border-top: 1px solid #333;
}

.detail-row {
  margin-bottom: 1rem;
}

.detail-row:last-of-type {
  margin-bottom: 1.5rem;
}

.detail-row strong {
  display: block;
  color: #999;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.detail-row p {
  color: #fff;
  margin: 0;
  word-break: break-word;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-download {
  background: #007AFF;
  color: white;
}

.btn-download:hover {
  background: #0051D5;
}

.btn-delete {
  background: transparent;
  color: #ff4a4a;
  border: 1px solid #3a1a1a;
}

.btn-delete:hover {
  background: #3a1a1a;
  border-color: #ff4a4a;
}
</style>
