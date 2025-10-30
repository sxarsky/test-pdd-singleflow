import { Router, Response } from 'express';
import { randomBytes } from 'crypto';
import db from '../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

function generateId() {
  return randomBytes(16).toString('hex');
}

// Reset database to initial seed data for current user
router.post('/reset', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Start transaction
    db.prepare('BEGIN').run();

    try {
      // Delete all existing tasks and projects for this user
      db.prepare('DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE owner_id = ?)').run(userId);
      db.prepare('DELETE FROM projects WHERE owner_id = ?').run(userId);

      // Create seed data
      const now = new Date().toISOString();

      // Create 3 projects with fixed IDs for testing
      const projects = [
        {
          id: '1',
          name: 'Website Redesign',
          description: 'Complete overhaul of the company website with modern design and improved UX',
          status: 'active',
          display_order: 0
        },
        {
          id: '2',
          name: 'Mobile App Development',
          description: 'Build a native mobile application for iOS and Android platforms',
          status: 'active',
          display_order: 1
        },
        {
          id: '3',
          name: 'Marketing Campaign Q4',
          description: 'Plan and execute marketing campaigns for the fourth quarter',
          status: 'active',
          display_order: 2
        }
      ];

      const insertProjectStmt = db.prepare(`
        INSERT INTO projects (id, name, description, owner_id, status, display_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const project of projects) {
        insertProjectStmt.run(
          project.id,
          project.name,
          project.description,
          userId,
          project.status,
          project.display_order,
          now,
          now
        );
      }

      // Create tasks for each project with fixed IDs for testing
      const tasks = [
        // Website Redesign tasks
        {
          id: '1',
          projectId: projects[0].id,
          title: 'Design homepage mockups',
          description: 'Create wireframes and high-fidelity mockups for the new homepage',
          status: 'done',
          priority: 'high',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 0
        },
        {
          id: '2',
          projectId: projects[0].id,
          title: 'Implement responsive navigation',
          description: 'Build a mobile-first navigation component with hamburger menu',
          status: 'in_progress',
          priority: 'high',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 1
        },
        {
          id: '3',
          projectId: projects[0].id,
          title: 'Set up analytics tracking',
          description: 'Integrate Google Analytics and set up event tracking',
          status: 'open',
          priority: 'medium',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 2
        },
        // Mobile App Development tasks
        {
          id: '4',
          projectId: projects[1].id,
          title: 'Set up React Native project',
          description: 'Initialize project with TypeScript and configure build tools',
          status: 'done',
          priority: 'urgent',
          dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 0
        },
        {
          id: '5',
          projectId: projects[1].id,
          title: 'Design authentication flow',
          description: 'Create login, signup, and password reset screens',
          status: 'review',
          priority: 'high',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 1
        },
        {
          id: '6',
          projectId: projects[1].id,
          title: 'Implement push notifications',
          description: 'Set up Firebase Cloud Messaging for push notifications',
          status: 'blocked',
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 2
        },
        // Marketing Campaign Q4 tasks
        {
          id: '7',
          projectId: projects[2].id,
          title: 'Research target audience',
          description: 'Conduct market research and create buyer personas',
          status: 'done',
          priority: 'high',
          dueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 0
        },
        {
          id: '8',
          projectId: projects[2].id,
          title: 'Create social media content calendar',
          description: 'Plan content for Instagram, Twitter, and LinkedIn for Q4',
          status: 'in_progress',
          priority: 'medium',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 1
        },
        {
          id: '9',
          projectId: projects[2].id,
          title: 'Design email templates',
          description: 'Create responsive email templates for newsletter campaigns',
          status: 'open',
          priority: 'low',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          displayOrder: 2
        }
      ];

      const insertTaskStmt = db.prepare(`
        INSERT INTO tasks (
          id, project_id, title, description, status, priority,
          assignee_id, reporter_id, due_date, display_order,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const task of tasks) {
        insertTaskStmt.run(
          task.id,
          task.projectId,
          task.title,
          task.description,
          task.status,
          task.priority,
          userId,
          userId,
          task.dueDate,
          task.displayOrder,
          now,
          now
        );
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      res.json({
        success: true,
        message: 'Database reset successfully',
        stats: {
          projects: projects.length,
          tasks: tasks.length
        }
      });
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

export default router;
