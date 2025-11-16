<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>New Image Request</h2>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="submitRequest">
          <div class="form-group">
            <label for="prompt">Prompt *</label>
            <textarea
              id="prompt"
              v-model="form.prompt"
              placeholder="Describe the image you want to generate..."
              rows="4"
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label for="negative_prompt">Negative Prompt</label>
            <textarea
              id="negative_prompt"
              v-model="form.negativePrompt"
              placeholder="Things to avoid in the image..."
              rows="2"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="n">Number of Images</label>
              <input
                type="number"
                id="n"
                v-model.number="form.n"
                min="1"
                max="10"
              />
            </div>

            <div class="form-group">
              <label for="steps">Steps</label>
              <input
                type="number"
                id="steps"
                v-model.number="form.steps"
                min="1"
                max="50"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="width">Width</label>
              <input
                type="number"
                id="width"
                v-model.number="form.width"
                min="256"
                max="1024"
                step="64"
              />
            </div>

            <div class="form-group">
              <label for="height">Height</label>
              <input
                type="number"
                id="height"
                v-model.number="form.height"
                min="256"
                max="1024"
                step="64"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="cfg_scale">CFG Scale</label>
            <input
              type="range"
              id="cfg_scale"
              v-model.number="form.cfgScale"
              min="1"
              max="20"
              step="0.5"
            />
            <span class="range-value">{{ form.cfgScale }}</span>
          </div>

          <div class="form-group">
            <label for="sampler">Sampler</label>
            <select id="sampler" v-model="form.sampler">
              <option value="k_euler">Euler</option>
              <option value="k_euler_a">Euler a</option>
              <option value="k_dpm_2">DPM 2</option>
              <option value="k_dpm_2_a">DPM 2 a</option>
              <option value="k_heun">Heun</option>
              <option value="k_dpm_fast">DPM fast</option>
              <option value="k_dpm_adaptive">DPM adaptive</option>
              <option value="k_lms">LMS</option>
              <option value="ddim">DDIM</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" @click="$emit('close')" class="btn btn-cancel">
              Cancel
            </button>
            <button type="submit" class="btn btn-submit" :disabled="submitting">
              {{ submitting ? 'Submitting...' : 'Generate' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { requestsApi } from '../api/client.js'

export default {
  name: 'RequestGeneratorModal',
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const submitting = ref(false)

    const form = reactive({
      prompt: '',
      negativePrompt: '',
      n: 1,
      steps: 30,
      width: 512,
      height: 512,
      cfgScale: 7,
      sampler: 'k_euler_a'
    })

    const submitRequest = async () => {
      try {
        submitting.value = true

        const params = {
          prompt: form.prompt,
          params: {
            n: form.n,
            steps: form.steps,
            width: form.width,
            height: form.height,
            cfg_scale: form.cfgScale,
            sampler_name: form.sampler,
            post_processing: []
          }
        }

        // Add negative prompt if provided
        if (form.negativePrompt) {
          params.params.negative_prompt = form.negativePrompt
        }

        await requestsApi.create({
          prompt: form.prompt,
          params
        })

        emit('submit')
      } catch (error) {
        console.error('Error submitting request:', error)
        alert('Failed to submit request. Please try again.')
      } finally {
        submitting.value = false
      }
    }

    return {
      form,
      submitting,
      submitRequest
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
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #333;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #999;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #fff;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #999;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  background: #0f0f0f;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #007AFF;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group input[type="range"] {
  width: calc(100% - 60px);
  margin-right: 1rem;
}

.range-value {
  display: inline-block;
  width: 50px;
  text-align: center;
  padding: 0.5rem;
  background: #0f0f0f;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: transparent;
  color: #999;
  border: 1px solid #333;
}

.btn-cancel:hover {
  background: #2a2a2a;
  color: #fff;
}

.btn-submit {
  background: #007AFF;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #0051D5;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
