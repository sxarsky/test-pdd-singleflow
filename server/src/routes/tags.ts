import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import db from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

function generateId() {
  // Seed data uses IDs 1-9, user-created starts at 100
  const result = db.prepare(`
    SELECT id FROM tags
    WHERE CAST(id AS INTEGER) >= 100
    ORDER BY CAST(id AS INTEGER) DESC
    LIMIT 1
  `).get() as any;

  if (!result) {
    return '100';
  }

  return String(parseInt(result.id, 10) + 1);
}

// Get all tags for current user
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const tags = db.prepare(`
      SELECT * FROM tags
      WHERE user_id = ?
      ORDER BY name ASC
    `).all(req.userId);

    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create tag
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    const tagId = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tags (id, name, color, user_id, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(tagId, name, color, req.userId, now);

    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId);

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update tag
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, color } = req.body;

    // Check if tag exists and belongs to user
    const tag = db.prepare(`
      SELECT * FROM tags
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    db.prepare(`
      UPDATE tags
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updatedTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);

    res.json(updatedTag);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    // Check if tag exists and belongs to user
    const tag = db.prepare(`
      SELECT * FROM tags
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.userId);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
