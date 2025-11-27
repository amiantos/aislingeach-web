<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Switch to Advanced Mode</h2>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <p>You have a style selected. What would you like to do?</p>

        <div class="option-buttons">
          <button @click="$emit('confirm', true)" class="btn btn-apply">
            <div class="btn-title">Apply Style & Switch</div>
            <div class="btn-description">Apply style settings to the form, then switch to Advanced mode</div>
          </button>

          <button @click="$emit('confirm', false)" class="btn btn-discard">
            <div class="btn-title">Discard Style & Switch</div>
            <div class="btn-description">Remove the style and switch to Advanced mode</div>
          </button>

          <button @click="$emit('close')" class="btn btn-cancel">
            <div class="btn-title">Cancel</div>
            <div class="btn-description">Stay in Simple mode with your style</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StyleSwitchModal',
  emits: ['close', 'confirm']
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-darkest);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 2rem;
}

.modal-content {
  background: var(--color-surface);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
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
  color: var(--color-text-tertiary);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-close:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  margin: 0 0 1.5rem 0;
  color: var(--color-gray-300);
  font-size: 1rem;
}

.option-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  padding: 1rem 1.25rem;
  border: 1px solid #333;
  border-radius: 8px;
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.btn:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-light);
}

.btn-title {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.btn-description {
  font-size: 0.85rem;
  color: var(--color-text-tertiary);
}

.btn-apply:hover {
  border-color: var(--color-primary);
}

.btn-apply:hover .btn-title {
  color: var(--color-primary);
}

.btn-discard:hover {
  border-color: var(--color-warning);
}

.btn-discard:hover .btn-title {
  color: var(--color-warning);
}

.btn-cancel:hover {
  border-color: var(--color-text-disabled);
}
</style>
