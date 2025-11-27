import express from 'express';
import axios from 'axios';
import { UserSettings } from '../db/models.js';

const router = express.Router();

// Cache for styles data
let stylesCache = null;
let stylesCacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// URLs for AI Horde Styles data
const STYLES_URL = 'https://raw.githubusercontent.com/Haidra-Org/AI-Horde-Styles/refs/heads/main/styles.json';
const PREVIEWS_URL = 'https://raw.githubusercontent.com/amiantos/AI-Horde-Styles-Previews/refs/heads/main/previews.json';
const CATEGORIES_URL = 'https://raw.githubusercontent.com/Haidra-Org/AI-Horde-Styles/refs/heads/main/categories.json';

/**
 * Process raw categories to filter out nested category references
 * Only keeps actual style names, discards category-only entries
 */
function processCategories(rawCategories, styleNames) {
  const styleNamesLower = new Set(styleNames.map(s => s.toLowerCase()));
  const categoryNamesLower = new Set(Object.keys(rawCategories).map(c => c.toLowerCase()));

  const processed = {};

  for (const [categoryName, items] of Object.entries(rawCategories)) {
    // Filter items to only include actual style names (not category references)
    const styleItems = items.filter(item => {
      const itemLower = item.toLowerCase();
      // Keep if it's a style name and NOT a category name
      return styleNamesLower.has(itemLower) && !categoryNamesLower.has(itemLower);
    });

    // Only include category if it has style items after filtering
    if (styleItems.length > 0) {
      processed[categoryName] = styleItems;
    }
  }

  return processed;
}

/**
 * Build categorized styles structure
 * Order: new, featured, [other categories alphabetically], uncategorized
 */
function buildCategorizedStyles(allStyles, categories, favoriteNames = []) {
  const result = [];
  const stylesByName = new Map(allStyles.map(s => [s.name.toLowerCase(), s]));
  const shownStyles = new Set();
  const favoritesLower = new Set(favoriteNames.map(f => f.toLowerCase()));

  // Helper to get style objects from names
  const getStyleObjects = (names) => {
    return names
      .map(name => stylesByName.get(name.toLowerCase()))
      .filter(s => s && !shownStyles.has(s.name.toLowerCase()));
  };

  // Add favorites section first (if any)
  if (favoriteNames.length > 0) {
    const favoriteStyles = allStyles.filter(s => favoritesLower.has(s.name.toLowerCase()));
    if (favoriteStyles.length > 0) {
      favoriteStyles.forEach(s => shownStyles.add(s.name.toLowerCase()));
      result.push({
        name: 'Favorites',
        styles: favoriteStyles
      });
    }
  }

  // Priority categories
  const priorityCategories = ['new', 'featured'];

  // Get other categories sorted alphabetically
  const otherCategories = Object.keys(categories)
    .filter(cat => !priorityCategories.includes(cat.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  // Build ordered category list
  const orderedCategories = [
    ...priorityCategories
      .filter(cat => Object.keys(categories).some(k => k.toLowerCase() === cat))
      .map(cat => Object.keys(categories).find(k => k.toLowerCase() === cat)),
    ...otherCategories
  ];

  // Add each category section
  for (const categoryName of orderedCategories) {
    const categoryStyleNames = categories[categoryName] || [];
    const stylesInCategory = getStyleObjects(categoryStyleNames);

    if (stylesInCategory.length > 0) {
      stylesInCategory.forEach(s => shownStyles.add(s.name.toLowerCase()));
      result.push({
        name: categoryName,
        styles: stylesInCategory
      });
    }
  }

  // Add uncategorized section for remaining styles
  const uncategorized = allStyles.filter(s => !shownStyles.has(s.name.toLowerCase()));
  if (uncategorized.length > 0) {
    result.push({
      name: 'Uncategorized',
      styles: uncategorized
    });
  }

  return result;
}

/**
 * Fetch and cache styles from GitHub
 */
async function fetchStyles() {
  const now = Date.now();

  // Return cached data if still valid
  if (stylesCache && (now - stylesCacheTime) < CACHE_DURATION) {
    console.log('[Styles] Returning cached styles');
    return stylesCache;
  }

  try {
    console.log('[Styles] Fetching styles from GitHub...');

    // Fetch styles, previews, and categories in parallel
    const [stylesResponse, previewsResponse, categoriesResponse] = await Promise.all([
      axios.get(STYLES_URL),
      axios.get(PREVIEWS_URL).catch(err => {
        console.warn('[Styles] Failed to fetch previews:', err.message);
        return { data: {} };
      }),
      axios.get(CATEGORIES_URL).catch(err => {
        console.warn('[Styles] Failed to fetch categories:', err.message);
        return { data: {} };
      })
    ]);

    const stylesData = stylesResponse.data;
    const previewsData = previewsResponse.data;
    const rawCategories = categoriesResponse.data;

    // Convert object to array with names and preview data
    const allStyles = Object.entries(stylesData).map(([name, data]) => ({
      name,
      ...data,
      preview: previewsData[name] || null
    }));

    // Sort alphabetically
    allStyles.sort((a, b) => a.name.localeCompare(b.name));

    // Process categories
    const styleNames = allStyles.map(s => s.name);
    const categories = processCategories(rawCategories, styleNames);

    stylesCache = {
      allStyles,
      stylesMap: stylesData,
      previewsMap: previewsData,
      categories
    };
    stylesCacheTime = now;

    console.log(`[Styles] Cached ${allStyles.length} styles, ${Object.keys(categories).length} categories`);

    return stylesCache;
  } catch (error) {
    console.error('[Styles] Error fetching styles:', error.message);
    throw error;
  }
}

// Get all styles with categories
router.get('/', async (req, res) => {
  try {
    const styles = await fetchStyles();

    // Get user's favorite styles
    let favoriteNames = [];
    try {
      const settings = UserSettings.get();
      if (settings.favorite_styles) {
        const parsed = JSON.parse(settings.favorite_styles);
        favoriteNames = Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn('[Styles] Failed to get user favorites:', err.message);
    }

    // Build categorized response
    const categorizedStyles = buildCategorizedStyles(
      styles.allStyles,
      styles.categories,
      favoriteNames
    );

    res.json({
      allStyles: styles.allStyles,
      stylesMap: styles.stylesMap,
      categorizedStyles
    });
  } catch (error) {
    console.error('Error fetching styles:', error);
    res.status(500).json({ error: 'Failed to fetch styles' });
  }
});

// Get a specific style by name
router.get('/:name', async (req, res) => {
  try {
    const styles = await fetchStyles();
    const styleName = req.params.name;

    if (!styles.stylesMap[styleName]) {
      return res.status(404).json({ error: 'Style not found' });
    }

    res.json({ name: styleName, ...styles.stylesMap[styleName] });
  } catch (error) {
    console.error('Error fetching style:', error);
    res.status(500).json({ error: 'Failed to fetch style' });
  }
});

// Force refresh styles cache
router.post('/refresh', async (req, res) => {
  try {
    stylesCache = null;
    const styles = await fetchStyles();
    res.json({ success: true, message: 'Styles cache refreshed', count: styles.allStyles.length });
  } catch (error) {
    console.error('Error refreshing styles cache:', error);
    res.status(500).json({ error: 'Failed to refresh styles cache' });
  }
});

export default router;
