import express from 'express';
import db from '../db/database.js';

const router = express.Router();

/**
 * GET /api/albums
 * Get all albums (system albums: Favorites, Hidden)
 */
router.get('/', (req, res) => {
  try {
    const albums = [];

    // Favorites album
    const favoritesCount = db.prepare(`
      SELECT COUNT(*) as count FROM generated_images
      WHERE is_favorite = 1 AND is_hidden = 0 AND is_trashed = 0
    `).get();

    const favoriteThumbnail = db.prepare(`
      SELECT uuid FROM generated_images
      WHERE is_favorite = 1 AND is_hidden = 0 AND is_trashed = 0
      ORDER BY date_created DESC
      LIMIT 1
    `).get();

    albums.push({
      id: 'favorites',
      name: 'Favorites',
      type: 'system',
      count: favoritesCount.count,
      thumbnail: favoriteThumbnail ? favoriteThumbnail.uuid : null
    });

    // Hidden album
    const hiddenCount = db.prepare(`
      SELECT COUNT(*) as count FROM generated_images
      WHERE is_hidden = 1 AND is_trashed = 0
    `).get();

    albums.push({
      id: 'hidden',
      name: 'Hidden',
      type: 'system',
      count: hiddenCount.count,
      thumbnail: null // Always use icon for hidden
    });

    res.json(albums);
  } catch (error) {
    console.error('Error fetching albums:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

export default router;
