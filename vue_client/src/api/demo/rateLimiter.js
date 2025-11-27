/**
 * Rate limiter for AI Horde API calls
 * Ensures minimum interval between requests to avoid hitting rate limits
 * Uses promise chaining to serialize throttle checks and prevent race conditions
 */

let lastApiCallTime = 0
let throttleQueue = Promise.resolve()
const MIN_API_INTERVAL = 1000 // 1 second minimum between API calls

/**
 * Throttle API calls to ensure minimum interval between requests
 * Call this before any API request to stablehorde.net
 */
export async function throttle() {
  const waitPromise = throttleQueue.then(async () => {
    const now = Date.now()
    const timeSinceLastCall = now - lastApiCallTime
    if (timeSinceLastCall < MIN_API_INTERVAL) {
      const waitTime = MIN_API_INTERVAL - timeSinceLastCall
      console.log(`[RateLimit] Waiting ${waitTime}ms before next API call`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    lastApiCallTime = Date.now()
  })

  // Update the queue (catch to prevent unhandled rejection if a call fails)
  throttleQueue = waitPromise.catch(() => {})

  return waitPromise
}
