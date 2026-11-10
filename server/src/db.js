import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DATABASE_URL = process.env.DATABASE_URL || '';
const DATABASE_URL = RAW_DATABASE_URL.replace(/&?channel_binding=[^&]*/g, '');

let clientType = 'sqlite';
let pool = null;
let sqliteDb = null;

// Helper: Convert SQLite '?' placeholders to Postgres '$1, $2, ...'
function toPgSql(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

const sampleEvents = [
  ['Lagos Tech & AI Innovation Summit', 'Join Nigeria\'s leading software engineers, AI researchers, and tech startup founders discussing frontier digital solutions, fintech, and venture capital.', 'Technology', 'Landmark Centre, Victoria Island, Lagos', '2027-02-20T09:00', '2027-02-15T23:59', 350, 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['Nigeria SME Growth & Fintech Masterclass', 'Practical workshops on scaling African enterprises, digital payments, regulatory compliance, and cross-border trade for Nigerian entrepreneurs.', 'Business', 'Transcorp Hilton, Abuja', '2027-03-12T10:00', '2027-03-08T23:59', 200, 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['Afrobeat & Contemporary Art Festival', 'A celebration of Nigerian visual arts, live Afrobeat performances, indigenous sculpture, and culinary showcases in the heart of Lagos.', 'Arts', 'Freedom Park & Nike Art Gallery, Lagos', '2027-04-05T12:00', '2027-04-01T23:59', 500, 'https://images.pexels.com/photos/7176026/pexels-photo-7176026.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['Lagos Creative & Fashion Week', 'Runway showcases, sustainable textile design, and buyer networking highlighting the vibrant diversity of contemporary Nigerian fashion and culture.', 'Arts', 'Eko Hotels & Suites, Victoria Island, Lagos', '2027-04-18T16:00', '2027-04-14T23:59', 300, 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['Naija Innovators & Developers Hackathon', '48-hour collaborative engineering hackathon building open-source solutions for healthcare access, renewable energy, and education across West Africa.', 'Technology', 'Yaba Tech Innovation Hub, Lagos', '2027-05-02T08:30', '2027-04-28T23:59', 250, 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200'],
  ['Abuja National Leadership & Governance Forum', 'A high-level assembly of civic leaders, policymakers, youth delegates, and international partners addressing sustainable economic development and governance.', 'General', 'International Conference Centre (ICC), Abuja', '2027-05-20T09:30', '2027-05-15T23:59', 400, 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1200']
];

// Initialize database
if (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://')) {
  try {
    const { default: pg } = await import('pg');
    const { Pool } = pg;
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    clientType = 'postgres';
    console.log('Using Neon PostgreSQL Cloud Database.');

    // Initialize Postgres tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'General',
        venue VARCHAR(255) NOT NULL,
        event_date VARCHAR(100) NOT NULL,
        registration_deadline VARCHAR(100),
        capacity INTEGER NOT NULL CHECK(capacity > 0),
        image_url TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
        UNIQUE(user_id, event_id)
      );
    `);

    // Seed admin if missing
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
    const adminCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [adminEmail]);
    let adminUserId = null;
    if (adminCheck.rows.length === 0) {
      const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
      const res = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [process.env.ADMIN_NAME || 'System Administrator', adminEmail, hash, 'admin']
      );
      adminUserId = res.rows[0].id;
    } else {
      adminUserId = adminCheck.rows[0].id;
    }

    // Seed regular test attendee user if missing
    const userEmail = 'user@example.com';
    const userCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [userEmail]);
    let testUserId = null;
    if (userCheck.rows.length === 0) {
      const userHash = bcrypt.hashSync('User123!', 12);
      const res = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        ['Chidi Okafor', userEmail, userHash, 'user']
      );
      testUserId = res.rows[0].id;
    } else {
      testUserId = userCheck.rows[0].id;
    }

    // Seed sample events if empty
    const eventCountRes = await pool.query('SELECT COUNT(*) AS count FROM events');
    if (Number(eventCountRes.rows[0].count) === 0) {
      for (const row of sampleEvents) {
        await pool.query(
          `INSERT INTO events (title, description, category, venue, event_date, registration_deadline, capacity, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          row
        );
      }

      // Seed a sample booking for the test user
      if (testUserId) {
        const firstEvent = await pool.query('SELECT id FROM events ORDER BY id ASC LIMIT 1');
        if (firstEvent.rows.length > 0) {
          await pool.query(
            'INSERT INTO registrations (user_id, event_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [testUserId, firstEvent.rows[0].id, 'confirmed']
          );
        }
      }
    }
  } catch (err) {
    console.error('Failed to connect to Neon PostgreSQL, falling back to local SQLite:', err.message);
    clientType = 'sqlite';
  }
}

if (clientType === 'sqlite') {
  const { DatabaseSync } = await import('node:sqlite');
  sqliteDb = new DatabaseSync(path.join(__dirname, '../database.sqlite'));

  sqliteDb.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      venue TEXT NOT NULL,
      event_date TEXT NOT NULL,
      registration_deadline TEXT,
      capacity INTEGER NOT NULL CHECK(capacity > 0),
      image_url TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
      UNIQUE(user_id, event_id)
    );
  `);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const existingAdmin = sqliteDb.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin123!', 12);
    sqliteDb.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
      .run(process.env.ADMIN_NAME || 'System Administrator', adminEmail, hash, 'admin');
  }

  // Seed regular test attendee user
  const userEmail = 'user@example.com';
  let regularUser = sqliteDb.prepare('SELECT id FROM users WHERE email = ?').get(userEmail);
  if (!regularUser) {
    const userHash = bcrypt.hashSync('User123!', 12);
    const info = sqliteDb.prepare('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)')
      .run('Chidi Okafor', userEmail, userHash, 'user');
    regularUser = { id: info.lastInsertRowid };
  }

  const eventCount = sqliteDb.prepare('SELECT COUNT(*) AS count FROM events').get().count;
  if (eventCount === 0) {
    const insert = sqliteDb.prepare(`
      INSERT INTO events (title,description,category,venue,event_date,registration_deadline,capacity,image_url)
      VALUES (?,?,?,?,?,?,?,?)
    `);
    sampleEvents.forEach(row => insert.run(...row));
  }

  // Ensure test attendee has at least 1 booking to view in dashboard
  if (regularUser) {
    const existingReg = sqliteDb.prepare('SELECT id FROM registrations WHERE user_id = ?').get(regularUser.id);
    if (!existingReg) {
      const firstEvent = sqliteDb.prepare('SELECT id FROM events ORDER BY id ASC LIMIT 1').get();
      if (firstEvent) {
        sqliteDb.prepare('INSERT OR IGNORE INTO registrations (user_id, event_id, status) VALUES (?,?,?)')
          .run(regularUser.id, firstEvent.id, 'confirmed');
      }
    }
  }
}

// Unified Database API (supports both Neon PostgreSQL and SQLite seamlessly)
const db = {
  isPostgres: clientType === 'postgres',

  async all(sql, params = []) {
    if (clientType === 'postgres') {
      const res = await pool.query(toPgSql(sql), params);
      return res.rows;
    } else {
      return sqliteDb.prepare(sql).all(...params);
    }
  },

  async get(sql, params = []) {
    if (clientType === 'postgres') {
      const res = await pool.query(toPgSql(sql), params);
      return res.rows[0] || null;
    } else {
      return sqliteDb.prepare(sql).get(...params) || null;
    }
  },

  async run(sql, params = []) {
    if (clientType === 'postgres') {
      let pgSql = toPgSql(sql);
      const isInsert = /^\s*insert\s+into/i.test(sql);
      if (isInsert && !/returning/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }
      const res = await pool.query(pgSql, params);
      const lastInsertRowid = res.rows && res.rows[0] ? res.rows[0].id : null;
      return { changes: res.rowCount, lastInsertRowid };
    } else {
      const info = sqliteDb.prepare(sql).run(...params);
      return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
    }
  },

  // Backward compatibility prepare() wrapper
  prepare(sql) {
    return {
      all: (...params) => db.all(sql, params),
      get: (...params) => db.get(sql, params),
      run: (...params) => db.run(sql, params)
    };
  }
};

export default db;
