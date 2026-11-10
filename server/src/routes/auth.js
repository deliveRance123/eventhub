import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'development-only-secret',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!name || name.length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ message: 'An account with this email address already exists.' });
  }

  const hash = bcrypt.hashSync(password, 12);
  const result = await db.run('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    name,
    email,
    hash,
    'user'
  ]);

  const user = await db.get('SELECT id, name, email, role FROM users WHERE id = ?', [result.lastInsertRowid]);
  const token = createToken(user);

  res.status(201).json({
    message: 'Account created successfully.',
    token,
    user
  });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email address or password.' });
  }

  const token = createToken(user);
  res.json({
    message: 'Logged in successfully.',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Admin User Management
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const users = await db.all(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
      (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id AND r.status = 'confirmed') AS registrations_count
    FROM users u
    ORDER BY u.created_at DESC
  `);
  res.json({ users });
});

router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ message: 'You cannot delete your own admin account.' });
  }
  const result = await db.run('DELETE FROM users WHERE id = ?', [id]);
  if (!result.changes) return res.status(404).json({ message: 'User not found.' });
  res.json({ message: 'User account removed.' });
});

export default router;
