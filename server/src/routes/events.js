import { Router } from 'express';
import db from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

const eventFields = ['title', 'description', 'category', 'venue', 'event_date', 'registration_deadline', 'capacity', 'image_url'];

function cleanEvent(body) {
  const event = {};
  for (const field of eventFields) event[field] = body[field] == null ? '' : String(body[field]).trim();
  event.capacity = Number(body.capacity);
  return event;
}

function validate(e) {
  if (!e.title || !e.description || !e.category || !e.venue || !e.event_date) return 'Complete all required event fields.';
  if (!Number.isInteger(e.capacity) || e.capacity < 1) return 'Capacity must be a positive whole number.';
  if (Number.isNaN(Date.parse(e.event_date))) return 'Enter a valid event date.';
  if (e.registration_deadline && Number.isNaN(Date.parse(e.registration_deadline))) return 'Enter a valid registration deadline.';
  return null;
}

router.get('/', async (req, res) => {
  const search = `%${String(req.query.search || '').trim()}%`;
  const category = String(req.query.category || '').trim();

  let sql = `
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS registered_count
    FROM events e
    WHERE (e.title LIKE ? OR e.description LIKE ? OR e.category LIKE ? OR e.venue LIKE ?)
  `;
  const params = [search, search, search, search];

  if (category && category.toLowerCase() !== 'all') {
    sql += ' AND LOWER(e.category) = LOWER(?)';
    params.push(category);
  }

  sql += ' ORDER BY e.event_date ASC';

  const events = await db.all(sql, params);
  res.json({ events });
});

router.get('/:id', async (req, res) => {
  const event = await db.get(`
    SELECT e.*,
      (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS registered_count
    FROM events e WHERE e.id = ?
  `, [Number(req.params.id)]);

  if (!event) return res.status(404).json({ message: 'Event not found.' });
  res.json({ event });
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  const e = cleanEvent(req.body);
  const error = validate(e);
  if (error) return res.status(400).json({ message: error });

  const result = await db.run(`
    INSERT INTO events (title, description, category, venue, event_date, registration_deadline, capacity, image_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [e.title, e.description, e.category, e.venue, e.event_date, e.registration_deadline, e.capacity, e.image_url, req.user.id]);

  const created = await db.get('SELECT * FROM events WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json({ event: created });
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const current = await db.get('SELECT * FROM events WHERE id = ?', [id]);
  if (!current) return res.status(404).json({ message: 'Event not found.' });

  const e = cleanEvent({ ...current, ...req.body });
  const error = validate(e);
  if (error) return res.status(400).json({ message: error });

  const regRow = await db.get("SELECT COUNT(*) AS n FROM registrations WHERE event_id = ? AND status = 'confirmed'", [id]);
  const registered = Number(regRow?.n || 0);

  if (e.capacity < registered) {
    return res.status(400).json({ message: `Capacity cannot be lower than the ${registered} confirmed registrations.` });
  }

  await db.run(`
    UPDATE events SET
      title = ?, description = ?, category = ?, venue = ?,
      event_date = ?, registration_deadline = ?, capacity = ?, image_url = ?
    WHERE id = ?
  `, [e.title, e.description, e.category, e.venue, e.event_date, e.registration_deadline, e.capacity, e.image_url, id]);

  const updated = await db.get('SELECT * FROM events WHERE id = ?', [id]);
  res.json({ event: updated });
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const result = await db.run('DELETE FROM events WHERE id = ?', [Number(req.params.id)]);
  if (!result.changes) return res.status(404).json({ message: 'Event not found.' });
  res.json({ message: 'Event deleted successfully.' });
});

export default router;
