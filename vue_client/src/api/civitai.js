/**
 * CivitAI API Client
 *
 * In normal mode: Proxies requests through our server to CivitAI API.
 * In demo mode: Attempts direct calls to CivitAI (may fail due to CORS).
 */

const isDemo = typeof __DEMO_MODE__ !== 'undefined' && __DEMO_MODE__

const CIVITAI_API_BASE = 'https://civitai.com/api/v1'

// Store apiClient for non-demo mode
let apiClientInstance = null

async function getApiClient() {
  if (isDemo) {
    return null
  }
  if (!apiClientInstance) {
    // Use static import at module level would be cleaner but we need conditional
    const module = await import('./client.js')
    apiClientInstance = module.default
  }
  return apiClientInstance
}

async function directCivitaiRequest(endpoint, options = {}) {
  const url = `${CIVITAI_API_BASE}${endpoint}`
  // Don't set Content-Type for GET requests - it triggers CORS preflight
  const response = await fetch(url, {
    ...options
  })
  if (!response.ok) {
    throw new Error(`CivitAI API error: ${response.status}`)
  }
  return response.json()
}

/**
 * Search LoRAs via server proxy
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {Array<string>} params.baseModelFilters - Base model filters
 * @param {boolean} params.nsfw - Include NSFW results
 * @param {string} params.sort - Sort order (Highest Rated, Most Downloaded, Newest)
 * @param {string} params.url - Direct URL to fetch (for pagination)
 * @param {AbortSignal} params.signal - Abort signal for cancellation
 * @returns {Promise<Object>} Response with items and metadata
 */
export async function searchLoras({
  query = '',
  page = 1,
  limit = 100,
  baseModelFilters = [],
  nsfw = false,
  sort = 'Highest Rated',
  url = null,
  signal = null
}) {
  try {
    if (isDemo) {
      // Direct CivitAI call - may fail due to CORS
      const sortMap = {
        'Highest Rated': 'Highest Rated',
        'Most Downloaded': 'Most Downloaded',
        'Newest': 'Newest'
      }
      const params = new URLSearchParams({
        types: 'LORA',
        query: query || '',
        page: page.toString(),
        limit: limit.toString(),
        sort: sortMap[sort] || 'Highest Rated',
        nsfw: nsfw.toString()
      })
      if (baseModelFilters.length > 0) {
        baseModelFilters.forEach(f => params.append('baseModels', f))
      }
      const endpoint = url ? url.replace(CIVITAI_API_BASE, '') : `/models?${params.toString()}`
      return await directCivitaiRequest(endpoint, { signal })
    }

    const apiClient = await getApiClient()
    const response = await apiClient.post('/civitai/search', {
      query,
      page,
      limit,
      baseModelFilters,
      nsfw,
      sort,
      url
    }, { signal });

    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('Request was aborted');
      throw error;
    }

    console.error('Error fetching CivitAI results:', error);
    throw error;
  }
}

/**
 * Get a specific LoRA model by ID via server proxy
 * @param {string|number} modelId - CivitAI model ID
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Model data
 */
export async function getLoraById(modelId, signal = null) {
  try {
    if (isDemo) {
      return await directCivitaiRequest(`/models/${modelId}`, { signal })
    }
    const apiClient = await getApiClient()
    const response = await apiClient.get(`/civitai/models/${modelId}`, { signal });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('Request was aborted');
      throw error;
    }

    console.error('Error fetching LoRA by ID:', error);
    throw error;
  }
}

/**
 * Get a LoRA model by version ID via server proxy
 * @param {string|number} versionId - CivitAI version ID
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Model data with all versions
 */
export async function getLoraByVersionId(versionId, signal = null) {
  try {
    if (isDemo) {
      const versionData = await directCivitaiRequest(`/model-versions/${versionId}`, { signal })
      // Fetch full model data to get all versions
      if (versionData.modelId) {
        return await directCivitaiRequest(`/models/${versionData.modelId}`, { signal })
      }
      return versionData
    }
    const apiClient = await getApiClient()
    const response = await apiClient.get(`/civitai/model-versions/${versionId}`, { signal });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('Request was aborted');
      throw error;
    }

    console.error('Error fetching LoRA by version ID:', error);
    throw error;
  }
}

/**
 * Search Textual Inversions via server proxy
 * @param {Object} params - Search parameters
 * @param {string} params.query - Search query
 * @param {number} params.page - Page number
 * @param {number} params.limit - Results per page
 * @param {Array<string>} params.baseModelFilters - Base model filters
 * @param {boolean} params.nsfw - Include NSFW results
 * @param {string} params.sort - Sort order (Highest Rated, Most Downloaded, Newest)
 * @param {string} params.url - Direct URL to fetch (for pagination)
 * @param {AbortSignal} params.signal - Abort signal for cancellation
 * @returns {Promise<Object>} Response with items and metadata
 */
export async function searchTextualInversions({
  query = '',
  page = 1,
  limit = 100,
  baseModelFilters = [],
  nsfw = false,
  sort = 'Highest Rated',
  url = null,
  signal = null
}) {
  try {
    if (isDemo) {
      // Direct CivitAI call - may fail due to CORS
      const sortMap = {
        'Highest Rated': 'Highest Rated',
        'Most Downloaded': 'Most Downloaded',
        'Newest': 'Newest'
      }
      const params = new URLSearchParams({
        types: 'TextualInversion',
        query: query || '',
        page: page.toString(),
        limit: limit.toString(),
        sort: sortMap[sort] || 'Highest Rated',
        nsfw: nsfw.toString()
      })
      if (baseModelFilters.length > 0) {
        baseModelFilters.forEach(f => params.append('baseModels', f))
      }
      const endpoint = url ? url.replace(CIVITAI_API_BASE, '') : `/models?${params.toString()}`
      return await directCivitaiRequest(endpoint, { signal })
    }

    const apiClient = await getApiClient()
    const response = await apiClient.post('/civitai/search-tis', {
      query,
      page,
      limit,
      baseModelFilters,
      nsfw,
      sort,
      url
    }, { signal });

    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('Request was aborted');
      throw error;
    }

    console.error('Error fetching CivitAI TI results:', error);
    throw error;
  }
}

/**
 * Get a specific TI model by ID via server proxy
 * @param {string|number} modelId - CivitAI model ID
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Model data
 */
export async function getTiById(modelId, signal = null) {
  try {
    if (isDemo) {
      return await directCivitaiRequest(`/models/${modelId}`, { signal })
    }
    const apiClient = await getApiClient()
    const response = await apiClient.get(`/civitai/ti-models/${modelId}`, { signal });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('Request was aborted');
      throw error;
    }

    console.error('Error fetching TI by ID:', error);
    throw error;
  }
}

/**
 * Get a TI model by version ID via server proxy
 * @param {string|number} versionId - CivitAI version ID
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<Object>} Model data with all versions
 */
export async function getTiByVersionId(versionId, signal = null) {
  try {
    if (isDemo) {
      const versionData = await directCivitaiRequest(`/model-versions/${versionId}`, { signal })
      // Fetch full model data to get all versions
      if (versionData.modelId) {
        return await directCivitaiRequest(`/models/${versionData.modelId}`, { signal })
      }
      return versionData
    }
    const apiClient = await getApiClient()
    const response = await apiClient.get(`/civitai/ti-versions/${versionId}`, { signal });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log('Request was aborted');
      throw error;
    }

    console.error('Error fetching TI by version ID:', error);
    throw error;
  }
}

export default {
  searchLoras,
  getLoraById,
  getLoraByVersionId,
  searchTextualInversions,
  getTiById,
  getTiByVersionId
};
