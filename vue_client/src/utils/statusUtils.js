/**
 * Utility functions for handling request status badges and display
 */

/**
 * Get the CSS class for a status badge based on request status
 * @param {string} status - The request status
 * @returns {string} The CSS class name
 */
export function getStatusClass(status) {
  if (status === 'completed') return 'status-completed'
  if (status === 'failed') return 'status-failed'
  if (status === 'submitting' || status === 'processing' || status === 'downloading') {
    return 'status-processing'
  }
  return 'status-pending'
}

/**
 * Get the display text for a status
 * @param {string} status - The request status
 * @returns {string} The display text
 */
export function getStatusText(status) {
  if (status === 'pending') return 'Pending'
  if (status === 'submitting') return 'Submitting'
  if (status === 'processing') return 'Processing'
  if (status === 'downloading') return 'Downloading'
  if (status === 'completed') return 'Completed'
  if (status === 'failed') return 'Failed'
  return status
}
