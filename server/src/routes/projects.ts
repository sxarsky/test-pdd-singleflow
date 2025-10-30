import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import db from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

function generateId() {
  // Seed data uses IDs 1-9, user-created starts at 100
  const result = db.prepare(`
    SELECT id FROM projects
    WHERE CAST(id AS INTEGER) >= 100
    ORDER BY CAST(id AS INTEGER) DESC
    LIMIT 1
  `).get() as any;

  if (!result) {
    return '100';
  }

  return String(parseInt(result.id, 10) + 1);
}

// Get all projects for current user
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const projects = db.prepare(`
      SELECT * FROM projects
      WHERE owner_id = ?
      ORDER BY display_order ASC
    `).all(req.userId);

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const project = db.prepare(`
      SELECT * FROM projects
      WHERE id = ? AND owner_id = ?
    `).get(req.params.id, req.userId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create project
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get max display order
    const maxOrder = db.prepare(`
      SELECT MAX(display_order) as max_order
      FROM projects
      WHERE owner_id = ?
    `).get(req.userId) as any;

    const displayOrder = (maxOrder?.max_order ?? -1) + 1;

    const projectId = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (id, name, description, owner_id, status, display_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, name, description || null, req.userId, status, displayOrder, now, now);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, description, status, display_order } = req.body;

    // Check if project exists and belongs to user
    const project = db.prepare(`
      SELECT * FROM projects
      WHERE id = ? AND owner_id = ?
    `).get(req.params.id, req.userId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(req.params.id);

    db.prepare(`
      UPDATE projects
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updatedProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);

    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    // Check if project exists and belongs to user
    const project = db.prepare(`
      SELECT * FROM projects
      WHERE id = ? AND owner_id = ?
    `).get(req.params.id, req.userId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update display orders
router.patch('/bulk/reorder', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { projects } = req.body;

    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'Projects must be an array' });
    }

    const updateStmt = db.prepare(`
      UPDATE projects
      SET display_order = ?, updated_at = ?
      WHERE id = ? AND owner_id = ?
    `);

    const now = new Date().toISOString();
    const transaction = db.transaction((projectsToUpdate: any[]) => {
      for (const project of projectsToUpdate) {
        updateStmt.run(project.display_order, now, project.id, req.userId);
      }
    });

    transaction(projects);

    res.json({ message: 'Projects reordered successfully' });
  } catch (error) {
    console.error('Reorder projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
