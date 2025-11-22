/**
 * CivitAI API Service
 *
 * Server-side proxy for CivitAI API requests.
 * Implements database caching to reduce API calls and improve performance.
 */

import { CivitaiSearchCache, LoraCache } from '../db/models.js';

const API_BASE_URL = 'https://civitai.com/api/v1';
const CACHE_TTL = 60 * 60 * 1000; // 60 minutes

/**
 * Build query string for CivitAI API
 */
function buildQueryString({ query = '', page = 1, limit = 100, baseModelFilters = [], nsfw = false, sort = 'Highest Rated' }) {
  const params = new URLSearchParams();

  // LoRA types (LoCon removed - not a valid API type)
  params.append('types', 'LORA');

  // Sorting
  params.append('sort', sort);

  // Limit
  params.append('limit', limit);

  // Search query
  if (query) {
    params.append('query', query);
    // NOTE: Cannot use 'page' parameter with query searches - must use cursor-based pagination
    // Pagination for searches is handled via metadata.nextPage cursor URLs
  } else {
    // Only use page parameter for browsing (no query)
    params.append('page', page);
  }

  // NSFW
  params.append('nsfw', nsfw);

  // Base model filters
  if (baseModelFilters.includes('SD 1.x')) {
    ['1.4', '1.5', '1.5 LCM'].forEach(version => {
      params.append('baseModels', `SD ${version}`);
    });
  }

  if (baseModelFilters.includes('SD 2.x')) {
    ['2.0', '2.0 768', '2.1', '2.1 768', '2.1 Unclip'].forEach(version => {
      params.append('baseModels', `SD ${version}`);
    });
  }

  if (baseModelFilters.includes('SDXL')) {
    ['0.9', '1.0', '1.0 LCM', 'Turbo'].forEach(version => {
      params.append('baseModels', `SDXL ${version}`);
    });
  }

  if (baseModelFilters.includes('Pony')) {
    params.append('baseModels', 'Pony');
  }

  if (baseModelFilters.includes('Flux')) {
    params.append('baseModels', 'Flux.1 S');
    params.append('baseModels', 'Flux.1 D');
  }

  if (baseModelFilters.includes('NoobAI')) {
    params.append('baseModels', 'NoobAI');
  }

  if (baseModelFilters.includes('Illustrious')) {
    params.append('baseModels', 'Illustrious');
  }

  return params.toString();
}

/**
 * Generate cache key for a search
 * Note: For searches with query, pagination is cursor-based (not page-based)
 * So we only include page in the cache key when there's no query
 */
function getCacheKey({ query = '', page = 1, limit = 100, baseModelFilters = [], nsfw = false, sort = 'Highest Rated' }) {
  // For searches (with query), don't include page in cache key (cursor-based pagination)
  // For browsing (no query), include page in cache key (page-based pagination)
  const pageKey = query ? 'p1' : `p${page}`;
  return `${query || 'default'}_${pageKey}_${limit}_${sort}_${(baseModelFilters || []).sort().join(',')}_${nsfw}`;
}

/**
 * Cache a model's versions in LoraCache for long-term persistence
 * This allows us to enrich historical requests with full LoRA metadata
 */
function cacheModelVersions(modelData) {
  try {
    if (!modelData || !modelData.modelVersions || !Array.isArray(modelData.modelVersions)) {
      return;
    }

    // Cache each version with the full model data
    for (const version of modelData.modelVersions) {
      if (version.id) {
        LoraCache.set(
          String(version.id),
          String(modelData.id),
          modelData
        );
      }
    }
  } catch (error) {
    console.error('[CivitAI] Error caching model versions:', error);
  }
}

/**
 * Search LoRAs on CivitAI
 */
export async function searchLoras({
  query = '',
  page = 1,
  limit = 100,
  baseModelFilters = [],
  nsfw = false,
  sort = 'Highest Rated',
  url = null
}) {
  try {
    let fetchUrl;

    if (url) {
      // Direct URL provided (for pagination)
      fetchUrl = url.startsWith('http') ? url : `${API_BASE_URL}/models?${url}`;
    } else {
      // Build query string
      const queryString = buildQueryString({ query, page, limit, baseModelFilters, nsfw, sort });
      fetchUrl = `${API_BASE_URL}/models?${queryString}`;

      // CACHE DISABLED FOR DEBUGGING
      // const cacheKey = getCacheKey({ query, page, limit, baseModelFilters, nsfw, sort });
      // const cached = CivitaiSearchCache.get(cacheKey);
      // if (cached && (Date.now() - cached.cached_at < CACHE_TTL)) {
      //   console.log(`[CivitAI] Cache hit for search: ${cacheKey}`);
      //   return {
      //     ...cached.result_data,
      //     cached: true
      //   };
      // }
    }

    // Fetch from CivitAI API
    console.log(`[CivitAI] Fetching from API: ${fetchUrl}`);
    const response = await fetch(fetchUrl);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage += ` - ${errorData.error}`;
        }
        console.error('[CivitAI] API Error Response:', errorData);
      } catch (e) {
        // Could not parse error response as JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Log the actual response for debugging
    console.log(`[CivitAI] API returned ${data.items?.length || 0} items`);
    console.log(`[CivitAI] Full metadata:`, JSON.stringify(data.metadata, null, 2));

    // CACHE DISABLED FOR DEBUGGING
    // if (!url) {
    //   const cacheKey = getCacheKey({ query, page, limit, baseModelFilters, nsfw, sort });
    //   CivitaiSearchCache.set(cacheKey, data);
    // }

    // Cache all model versions in LoraCache for long-term persistence
    if (data.items && Array.isArray(data.items)) {
      for (const model of data.items) {
        cacheModelVersions(model);
      }
    }

    return {
      items: data.items || [],
      metadata: data.metadata || {
        nextPage: null,
        currentPage: page,
        pageSize: limit
      },
      cached: false
    };
  } catch (error) {
    console.error('[CivitAI] Error searching LoRAs:', error);
    throw error;
  }
}

/**
 * Get a specific LoRA model by ID
 */
export async function getLoraById(modelId) {
  try {
    const cacheKey = `model_${modelId}`;
    const cached = CivitaiSearchCache.get(cacheKey);

    if (cached && (Date.now() - cached.cached_at < CACHE_TTL)) {
      console.log(`[CivitAI] Cache hit for model: ${modelId}`);
      return {
        ...cached.result_data,
        cached: true
      };
    }

    // Fetch from CivitAI API
    console.log(`[CivitAI] Fetching model from API: ${modelId}`);
    const response = await fetch(`${API_BASE_URL}/models/${modelId}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the result
    CivitaiSearchCache.set(cacheKey, data);

    // Cache model versions in LoraCache for long-term persistence
    cacheModelVersions(data);

    return {
      ...data,
      cached: false
    };
  } catch (error) {
    console.error(`[CivitAI] Error fetching model ${modelId}:`, error);
    throw error;
  }
}

/**
 * Get a LoRA model by version ID (two-step process)
 * Checks LoraCache first for long-term persistence, then CivitaiSearchCache, then API
 */
export async function getLoraByVersionId(versionId) {
  try {
    // Check long-term LoraCache first
    const loraCached = LoraCache.get(String(versionId));
    if (loraCached) {
      console.log(`[CivitAI] LoraCache hit for version: ${versionId}`);
      return {
        ...loraCached.full_metadata,
        cached: true
      };
    }

    // Check short-term CivitaiSearchCache
    const cacheKey = `version_${versionId}`;
    const cached = CivitaiSearchCache.get(cacheKey);

    if (cached && (Date.now() - cached.cached_at < CACHE_TTL)) {
      console.log(`[CivitAI] SearchCache hit for version: ${versionId}`);
      return {
        ...cached.result_data,
        cached: true
      };
    }

    // Step 1: Fetch version data to get model ID
    console.log(`[CivitAI] Fetching version from API: ${versionId}`);
    const versionResponse = await fetch(`${API_BASE_URL}/model-versions/${versionId}`);

    if (!versionResponse.ok) {
      throw new Error(`HTTP error! status: ${versionResponse.status}`);
    }

    const versionData = await versionResponse.json();
    const modelId = versionData.modelId;

    // Step 2: Fetch full model data using model ID
    const modelData = await getLoraById(modelId);

    // Cache the result under version ID for future lookups
    CivitaiSearchCache.set(cacheKey, modelData);

    // Cache model versions in LoraCache for long-term persistence
    cacheModelVersions(modelData);

    return {
      ...modelData,
      cached: false
    };
  } catch (error) {
    console.error(`[CivitAI] Error fetching version ${versionId}:`, error);
    throw error;
  }
}

export default {
  searchLoras,
  getLoraById,
  getLoraByVersionId
};
