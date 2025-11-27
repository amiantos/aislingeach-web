<template>
  <BaseModal
    :show="show"
    @close="handleClose"
    size="medium"
    :closeOnBackdrop="false"
    :showClose="false"
  >
    <div class="welcome-modal-content">
      <h2>{{ title }}</h2>

      <!-- Demo Mode Content -->
      <template v-if="isDemoMode">
        <p class="welcome-text">
          This is a demo version of Dreamers Guild, running entirely in your browser using local storage APIs.
        </p>
        <p class="welcome-text">
          While the demo is great for trying out the app, it has a few limitations compared to the self-hosted version:
        </p>
        <ul class="limitations-list">
          <li>Limited CivitAI search support</li>
          <li>Storage is constrained to browser limits</li>
          <li>Data can be lost if you clear browser data</li>
        </ul>
        <p class="welcome-text">
          If you enjoy this demo, consider installing the self-hosted version on your home network for the full experience!
        </p>
      </template>

      <!-- Non-Demo Mode Content -->
      <template v-else>
        <p class="welcome-text">
          Dreamers Guild is a beautiful web interface for generating AI images using <strong>AI Horde</strong>,
          a free, crowdsourced GPU network.
        </p>
        <p class="welcome-text">
          AI Horde allows you to generate images using Stable Diffusion models without needing your own GPU.
          Volunteers around the world contribute their computing power, and you benefit from their generosity!
        </p>
        <p class="welcome-text">
          <strong>Getting started:</strong> You can generate images immediately as an anonymous user.
          However, registering for a free API key will give you faster generation times and priority in the queue.
        </p>
      </template>

      <!-- Checkbox -->
      <label class="dont-show-checkbox">
        <input type="checkbox" v-model="dontShowAgain" />
        <span>Don't show this again</span>
      </label>

      <!-- Action Buttons -->
      <div class="button-group">
        <template v-if="isDemoMode">
          <a
            href="https://github.com/amiantos/aislingeach-web"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary"
          >
            View on GitHub
          </a>
          <a
            href="https://github.com/amiantos/aislingeach-web#installation"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary"
          >
            Self-Hosted Setup
          </a>
        </template>
        <template v-else>
          <a
            href="https://aihorde.net"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary"
          >
            AI Horde Website
          </a>
          <a
            href="https://aihorde.net/register"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-secondary"
          >
            Get API Key
          </a>
        </template>
        <button @click="handleClose" class="btn btn-primary">
          Get Started
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const isDemoMode = typeof __DEMO_MODE__ !== 'undefined' && __DEMO_MODE__
const dontShowAgain = ref(false)

const title = computed(() => {
  return isDemoMode ? 'Welcome to Dreamers Guild (DEMO)' : 'Welcome to Dreamers Guild'
})

const handleClose = () => {
  emit('close', { dontShowAgain: dontShowAgain.value })
}
</script>

<style scoped>
.welcome-modal-content {
  padding: 2rem;
}

.welcome-modal-content h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  color: var(--color-text-primary);
  text-align: center;
}

.welcome-text {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.welcome-text strong {
  color: var(--color-text-primary);
}

.limitations-list {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem 1.5rem;
  padding: 0;
}

.limitations-list li {
  margin-bottom: 0.5rem;
}

.dont-show-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
  cursor: pointer;
  color: var(--color-text-tertiary);
  font-size: 0.9rem;
}

.dont-show-checkbox input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.btn-primary {
  background-color: var(--color-info);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-info-hover);
}

.btn-secondary {
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background-color: var(--color-surface-hover, var(--color-surface));
  border-color: var(--color-text-tertiary);
}

@media (max-width: 480px) {
  .welcome-modal-content {
    padding: 1.5rem;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
