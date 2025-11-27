import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Settings Store - Centralized state management for user settings
 * Handles worker preferences with localStorage caching
 */
export const useSettingsStore = defineStore('settings', () => {
  // AI Horde preferences (renamed from worker preferences)
  const workerPreferences = ref({
    slowWorkers: true,
    trustedWorkers: false,
    nsfw: false,
    allowDowngrade: true,
    replacementFilter: true
  })

  // Loading states
  const loadingWorkerPrefs = ref(false)

  /**
   * Load worker preferences from localStorage
   * @returns {Object} Worker preferences
   */
  const loadWorkerPreferences = () => {
    try {
      loadingWorkerPrefs.value = true
      const savedPrefs = localStorage.getItem('workerPreferences')
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs)
        workerPreferences.value = { ...workerPreferences.value, ...prefs }
      }
      return workerPreferences.value
    } catch (error) {
      console.error('Error loading worker preferences:', error)
      return workerPreferences.value
    } finally {
      loadingWorkerPrefs.value = false
    }
  }

  /**
   * Save worker preferences to localStorage
   * @param {Object} prefs - Worker preferences to save
   */
  const saveWorkerPreferences = (prefs) => {
    try {
      workerPreferences.value = { ...workerPreferences.value, ...prefs }
      localStorage.setItem('workerPreferences', JSON.stringify(workerPreferences.value))
    } catch (error) {
      console.error('Error saving worker preferences:', error)
    }
  }

  /**
   * Reset worker preferences to defaults
   */
  const resetWorkerPreferences = () => {
    workerPreferences.value = {
      slowWorkers: true,
      trustedWorkers: false,
      nsfw: false,
      allowDowngrade: true,
      replacementFilter: true
    }
    localStorage.removeItem('workerPreferences')
  }

  return {
    // State
    workerPreferences,
    loadingWorkerPrefs,
    // Actions
    loadWorkerPreferences,
    saveWorkerPreferences,
    resetWorkerPreferences
  }
})
