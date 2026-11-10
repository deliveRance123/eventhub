import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/:eventId', authenticate, async (req, res) => {
  const eventId = Number(req.params.eventId);
  try {
    const event = await db.get('SELECT * FROM events WHERE id = ?', [eventId]);
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    if (new Date(event.event_date).getTime() <= Date.now()) {
      return res.status(400).json({ message: 'This event has already taken place.' });
    }
    if (event.registration_deadline && new Date(event.registration_deadline).getTime() < Date.now()) {
      return res.status(400).json({ message: 'Registration for this event has closed.' });
    }

    const existing = await db.get('SELECT status FROM registrations WHERE user_id = ? AND event_id = ?', [req.user.id, eventId]);
    if (existing?.status === 'confirmed') {
      return res.status(409).json({ message: 'You are already registered for this event.' });
    }

    const countRow = await db.get("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'confirmed'", [eventId]);
    const count = Number(countRow?.n || 0);
    if (count >= Number(event.capacity)) {
      return res.status(409).json({ message: 'This event has reached its registration capacity.' });
    }

    if (existing) {
      await db.run("UPDATE registrations SET status = 'confirmed', registered_at = CURRENT_TIMESTAMP WHERE user_id = ? AND event_id = ?", [req.user.id, eventId]);
    } else {
      await db.run('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)', [req.user.id, eventId]);
    }

    const registration = await db.get('SELECT * FROM registrations WHERE user_id = ? AND event_id = ?', [req.user.id, eventId]);
    res.status(201).json({ message: 'Registration confirmed.', registration });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Unable to complete registration.' });
  }
});

router.get('/mine/list', authenticate, async (req, res) => {
  const registrations = await db.all(`
    SELECT r.id AS registration_id, r.registered_at, r.status, e.*,
      (SELECT COUNT(*) FROM registrations x WHERE x.event_id = e.id AND x.status = 'confirmed') AS registered_count
    FROM registrations r JOIN events e ON e.id = r.event_id
    WHERE r.user_id = ? ORDER BY e.event_date ASC
  `, [req.user.id]);
  res.json({ registrations });
});

router.delete('/:eventId', authenticate, async (req, res) => {
  const result = await db.run(
    "UPDATE registrations SET status = 'cancelled' WHERE user_id = ? AND event_id = ? AND status = 'confirmed'",
    [req.user.id, Number(req.params.eventId)]
  );
  if (!result.changes) return res.status(404).json({ message: 'Active registration not found.' });
  res.json({ message: 'Registration cancelled.' });
});

router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  const rows = await db.all(`
    SELECT r.id AS registration_id, r.registered_at, r.status, u.name AS attendee_name, u.email, e.title AS event_title, e.event_date
    FROM registrations r
    JOIN users u ON u.id = r.user_id
    JOIN events e ON e.id = r.event_id
    ORDER BY r.registered_at DESC
  `);
  res.json({ registrations: rows });
});

export default router;
