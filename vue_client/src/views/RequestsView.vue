<template>
  <div class="requests-view">
    <div class="header">
      <h2>Requests</h2>
      <div class="queue-status" v-if="queueStatus">
        <span class="status-dot" :class="{ active: queueStatus.isProcessing }"></span>
        <span>{{ queueStatus.active }}/{{ queueStatus.maxActive }} active</span>
        <span class="divider">•</span>
        <span>{{ queueStatus.pendingRequests }} pending</span>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading requests...</div>

    <div v-else-if="requests.length === 0" class="empty-state">
      <p>No requests yet</p>
      <p class="hint">Click "New Request" to generate your first AI image</p>
    </div>

    <div v-else class="requests-grid">
      <RequestCard
        v-for="request in requests"
        :key="request.uuid"
        :request="request"
        @view-images="viewRequestImages"
        @delete="deleteRequest"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { requestsApi } from '../api/client.js'
import RequestCard from '../components/RequestCard.vue'

export default {
  name: 'RequestsView',
  components: {
    RequestCard
  },
  setup() {
    const router = useRouter()
    const requests = ref([])
    const queueStatus = ref(null)
    const loading = ref(true)
    let pollInterval = null

    const fetchRequests = async () => {
      try {
        const response = await requestsApi.getAll()
        requests.value = response.data
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        loading.value = false
      }
    }

    const fetchQueueStatus = async () => {
      try {
        const response = await requestsApi.getQueueStatus()
        queueStatus.value = response.data
      } catch (error) {
        console.error('Error fetching queue status:', error)
      }
    }

    const viewRequestImages = (requestId) => {
      router.push(`/library/request/${requestId}`)
    }

    const deleteRequest = async (requestId) => {
      if (!confirm('Delete this request?')) return

      try {
        await requestsApi.delete(requestId)
        requests.value = requests.value.filter(r => r.uuid !== requestId)
      } catch (error) {
        console.error('Error deleting request:', error)
      }
    }

    onMounted(() => {
      fetchRequests()
      fetchQueueStatus()

      // Poll for updates every 2 seconds
      pollInterval = setInterval(() => {
        fetchRequests()
        fetchQueueStatus()
      }, 2000)
    })

    onUnmounted(() => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    })

    return {
      requests,
      queueStatus,
      loading,
      viewRequestImages,
      deleteRequest
    }
  }
}
</script>

<style scoped>
.requests-view {
  padding: 1rem 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 2rem;
  font-weight: 600;
}

.queue-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: #1a1a1a;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #999;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
}

.status-dot.active {
  background: #00ff00;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.divider {
  color: #444;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 0.5rem;
}

.empty-state .hint {
  font-size: 0.9rem;
  color: #555;
}

.requests-grid {
  display: grid;
  gap: 1rem;
}
</style>
