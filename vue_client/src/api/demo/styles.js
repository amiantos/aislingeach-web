import { getHordeStyles } from './horde.js'

const STYLES_CACHE_KEY = 'demoStyles'
const STYLES_CACHE_VERSION = 3 // Increment to invalidate old caches
const CACHE_TTL = 60 * 60 * 1000 // 1 hour
const PREVIEWS_URL = 'https://raw.githubusercontent.com/amiantos/AI-Horde-Styles-Previews/refs/heads/main/previews.json'
const CATEGORIES_URL = 'https://raw.githubusercontent.com/Haidra-Org/AI-Horde-Styles/refs/heads/main/categories.json'

function getCachedStyles() {
  const cached = localStorage.getItem(STYLES_CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp, version } = JSON.parse(cached)
      // Invalidate cache if version doesn't match or is missing
      if (version !== STYLES_CACHE_VERSION) {
        console.log('[Demo] Styles cache version mismatch, invalidating')
        localStorage.removeItem(STYLES_CACHE_KEY)
        return null
      }
      if (Date.now() - timestamp < CACHE_TTL) {
        return data
      }
    } catch (e) {
      localStorage.removeItem(STYLES_CACHE_KEY)
      return null
    }
  }
  return null
}

function cacheStyles(styles) {
  localStorage.setItem(STYLES_CACHE_KEY, JSON.stringify({
    data: styles,
    timestamp: Date.now(),
    version: STYLES_CACHE_VERSION
  }))
}

async function fetchPreviews() {
  try {
    const response = await fetch(PREVIEWS_URL)
    if (!response.ok) {
      console.warn('[Demo] Failed to fetch style previews')
      return {}
    }
    return await response.json()
  } catch (error) {
    console.warn('[Demo] Error fetching style previews:', error)
    return {}
  }
}

async function fetchCategories() {
  try {
    const response = await fetch(CATEGORIES_URL)
    if (!response.ok) {
      console.warn('[Demo] Failed to fetch categories')
      return {}
    }
    return await response.json()
  } catch (error) {
    console.warn('[Demo] Error fetching categories:', error)
    return {}
  }
}

/**
 * Process raw categories to filter out nested category references
 */
function processCategories(rawCategories, styleNames) {
  const styleNamesLower = new Set(styleNames.map(s => s.toLowerCase()))
  const categoryNamesLower = new Set(Object.keys(rawCategories).map(c => c.toLowerCase()))

  const processed = {}

  for (const [categoryName, items] of Object.entries(rawCategories)) {
    const styleItems = items.filter(item => {
      const itemLower = item.toLowerCase()
      return styleNamesLower.has(itemLower) && !categoryNamesLower.has(itemLower)
    })

    if (styleItems.length > 0) {
      processed[categoryName] = styleItems
    }
  }

  return processed
}

/**
 * Build categorized styles structure
 * Order: new, featured, [other categories alphabetically], uncategorized
 */
function buildCategorizedStyles(allStyles, categories, favoriteNames = []) {
  const result = []
  const stylesByName = new Map(allStyles.map(s => [s.name.toLowerCase(), s]))
  const shownStyles = new Set()
  const favoritesLower = new Set(favoriteNames.map(f => f.toLowerCase()))

  const getStyleObjects = (names) => {
    return names
      .map(name => stylesByName.get(name.toLowerCase()))
      .filter(s => s && !shownStyles.has(s.name.toLowerCase()))
  }

  // Add favorites section first
  if (favoriteNames.length > 0) {
    const favoriteStyles = allStyles.filter(s => favoritesLower.has(s.name.toLowerCase()))
    if (favoriteStyles.length > 0) {
      favoriteStyles.forEach(s => shownStyles.add(s.name.toLowerCase()))
      result.push({ name: 'Favorites', styles: favoriteStyles })
    }
  }

  // Priority categories
  const priorityCategories = ['new', 'featured']
  const otherCategories = Object.keys(categories)
    .filter(cat => !priorityCategories.includes(cat.toLowerCase()))
    .sort((a, b) => a.localeCompare(b))

  const orderedCategories = [
    ...priorityCategories
      .filter(cat => Object.keys(categories).some(k => k.toLowerCase() === cat))
      .map(cat => Object.keys(categories).find(k => k.toLowerCase() === cat)),
    ...otherCategories
  ]

  for (const categoryName of orderedCategories) {
    const categoryStyleNames = categories[categoryName] || []
    const stylesInCategory = getStyleObjects(categoryStyleNames)

    if (stylesInCategory.length > 0) {
      stylesInCategory.forEach(s => shownStyles.add(s.name.toLowerCase()))
      result.push({ name: categoryName, styles: stylesInCategory })
    }
  }

  // Uncategorized
  const uncategorized = allStyles.filter(s => !shownStyles.has(s.name.toLowerCase()))
  if (uncategorized.length > 0) {
    result.push({ name: 'Uncategorized', styles: uncategorized })
  }

  return result
}

async function fetchAndProcessStyles() {
  console.log('[Demo] Fetching styles, previews, and categories...')

  // Fetch styles, previews, and categories in parallel
  const [rawStyles, previews, rawCategories] = await Promise.all([
    getHordeStyles(),
    fetchPreviews(),
    fetchCategories()
  ])

  const previewCount = Object.keys(previews).length
  const styleCount = Object.keys(rawStyles).length
  const categoryCount = Object.keys(rawCategories).length
  console.log(`[Demo] Fetched ${styleCount} styles, ${previewCount} previews, ${categoryCount} raw categories`)

  const styles = Object.entries(rawStyles).map(([name, style]) => ({
    name,
    prompt: style.prompt || '',
    negative_prompt: style.negative_prompt || '',
    model: style.model || null,
    sampler_name: style.sampler_name || null,
    width: style.width || null,
    height: style.height || null,
    steps: style.steps || null,
    cfg_scale: style.cfg_scale || null,
    loras: style.loras || [],
    preview: previews[name] || null
  }))

  // Sort alphabetically
  styles.sort((a, b) => a.name.localeCompare(b.name))

  // Process categories
  const styleNames = styles.map(s => s.name)
  const categories = processCategories(rawCategories, styleNames)

  console.log(`[Demo] ${styles.length} styles, ${Object.keys(categories).length} processed categories`)

  return { allStyles: styles, categories }
}

// Get favorites from localStorage (demo mode doesn't have server settings)
function getDemoFavorites() {
  try {
    const stored = localStorage.getItem('demoFavoriteStyles')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const stylesApi = {
  async getAll() {
    let cached = getCachedStyles()

    if (!cached) {
      try {
        cached = await fetchAndProcessStyles()
        cacheStyles(cached)
      } catch (error) {
        console.error('Failed to fetch styles:', error)
        cached = { allStyles: [], categories: {} }
      }
    }

    // Get favorites and build categorized styles
    const favoriteNames = getDemoFavorites()
    const categorizedStyles = buildCategorizedStyles(cached.allStyles, cached.categories, favoriteNames)

    // Match server format
    return {
      data: {
        allStyles: cached.allStyles,
        categorizedStyles
      }
    }
  },

  async refresh() {
    localStorage.removeItem(STYLES_CACHE_KEY)
    const cached = await fetchAndProcessStyles()
    cacheStyles(cached)

    const favoriteNames = getDemoFavorites()
    const categorizedStyles = buildCategorizedStyles(cached.allStyles, cached.categories, favoriteNames)

    return {
      data: {
        allStyles: cached.allStyles,
        categorizedStyles
      }
    }
  }
}
