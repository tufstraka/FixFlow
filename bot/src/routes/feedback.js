import express from 'express';
const router = express.Router();
import logger from '../utils/logger.js';
import db from '../db.js';
import { authenticateUser } from '../middleware/auth.js';

/**
 * Submit feedback (public endpoint - no auth required)
 * POST /api/feedback
 */
router.post('/', async (req, res) => {
  try {
    const { type, message, email, rating, page, userAgent } = req.body;

    // Validate required fields
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Validate type
    const validTypes = ['bug', 'feature', 'general', 'praise'];
    const feedbackType = validTypes.includes(type) ? type : 'general';

    // Validate rating
    let validRating = null;
    if (rating !== null && rating !== undefined) {
      const ratingNum = parseInt(rating);
      if (!isNaN(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        validRating = ratingNum;
      }
    }

    // Try to get user from token if provided (optional)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { rows } = await db.query(`
          SELECT u.id FROM users u
          INNER JOIN user_sessions s ON u.id = s.user_id
          WHERE s.session_token = $1 AND s.expires_at > NOW()
        `, [token]);
        if (rows[0]) {
          userId = rows[0].id;
        }
      } catch {
        // Ignore auth errors - feedback is still accepted
      }
    }

    // Insert feedback
    const { rows } = await db.query(`
      INSERT INTO feedback (type, message, email, rating, page, user_agent, user_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', NOW())
      RETURNING id
    `, [
      feedbackType,
      message.trim(),
      email?.trim() || null,
      validRating,
      page || null,
      userAgent || null,
      userId
    ]);

    logger.info(`[FEEDBACK] New feedback submitted: type=${feedbackType}, id=${rows[0].id}`);

    res.status(201).json({
      success: true,
      id: rows[0].id
    });
  } catch (error) {
    logger.error('[FEEDBACK] Failed to submit feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;