import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import db from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

function generateId() {
  // Seed data uses IDs 1-9, user-created starts at 100
  const result = db.prepare(`
    SELECT id FROM tasks
    WHERE CAST(id AS INTEGER) >= 100
    ORDER BY CAST(id AS INTEGER) DESC
    LIMIT 1
  `).get() as any;

  if (!result) {
    return '100';
  }

  return String(parseInt(result.id, 10) + 1);
}

// Get all tasks (optionally filtered by project)
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { project_id } = req.query;

    let query = `
      SELECT t.* FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE p.owner_id = ?
    `;
    const params: any[] = [req.userId];

    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }

    query += ' ORDER BY t.display_order ASC';

    const tasks = db.prepare(query).all(...params);

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single task
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `).get(req.params.id, req.userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get tags for this task
    const tags = db.prepare(`
      SELECT tg.* FROM tags tg
      INNER JOIN task_tags tt ON tg.id = tt.tag_id
      WHERE tt.task_id = ?
    `).all(req.params.id);

    res.json({ ...task, tags });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const {
      project_id,
      title,
      description,
      status = 'open',
      priority = 'medium',
      assignee_id,
      due_date,
      tag_ids = []
    } = req.body;

    if (!project_id || !title) {
      return res.status(400).json({ error: 'Project ID and title are required' });
    }

    // Verify project exists and belongs to user
    const project = db.prepare(`
      SELECT * FROM projects
      WHERE id = ? AND owner_id = ?
    `).get(project_id, req.userId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get max display order for this project and status
    const maxOrder = db.prepare(`
      SELECT MAX(display_order) as max_order
      FROM tasks
      WHERE project_id = ? AND status = ?
    `).get(project_id, status) as any;

    const displayOrder = (maxOrder?.max_order ?? -1) + 1;

    const taskId = generateId();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, status, priority,
        assignee_id, reporter_id, due_date, display_order, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId, project_id, title, description || null, status, priority,
      assignee_id || null, req.userId, due_date || null, displayOrder, now, now
    );

    // Add tags if provided
    if (tag_ids.length > 0) {
      const insertTag = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
      const transaction = db.transaction((tags: string[]) => {
        for (const tagId of tags) {
          insertTag.run(taskId, tagId);
        }
      });
      transaction(tag_ids);
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.patch('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      display_order,
      tag_ids
    } = req.body;

    // Check if task exists and user has access
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `).get(req.params.id, req.userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (assignee_id !== undefined) {
      updates.push('assignee_id = ?');
      values.push(assignee_id);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(req.params.id);

      db.prepare(`
        UPDATE tasks
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...values);
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(req.params.id);

      if (tag_ids.length > 0) {
        const insertTag = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)');
        const transaction = db.transaction((tags: string[]) => {
          for (const tagId of tags) {
            insertTag.run(req.params.id, tagId);
          }
        });
        transaction(tag_ids);
      }
    }

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    // Check if task exists and user has access
    const task = db.prepare(`
      SELECT t.* FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND p.owner_id = ?
    `).get(req.params.id, req.userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update display orders
router.patch('/bulk/reorder', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks must be an array' });
    }

    const updateStmt = db.prepare(`
      UPDATE tasks
      SET display_order = ?, status = ?, updated_at = ?
      WHERE id = ?
    `);

    const now = new Date().toISOString();
    const transaction = db.transaction((tasksToUpdate: any[]) => {
      for (const task of tasksToUpdate) {
        updateStmt.run(task.display_order, task.status, now, task.id);
      }
    });

    transaction(tasks);

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
