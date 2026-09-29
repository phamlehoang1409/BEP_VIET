let DatabaseSync = null;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (e) {
  // node:sqlite not supported on Node < 22.5.0 or serverless environment
}

const path = require('path');
const fs = require('fs');

let db = null;
try {
  if (DatabaseSync) {
    const dbPath = path.join(__dirname, 'food_delivery.db');
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA foreign_keys = ON;');
  }
} catch (err) {
  console.warn('SQLite init skipped (likely running on read-only serverless):', err.message);
}

module.exports = {
  db,
  query: (sql, params = []) => (db ? db.prepare(sql).all(...params) : []),
  queryOne: (sql, params = []) => (db ? db.prepare(sql).get(...params) : null),
  run: (sql, params = []) => (db ? db.prepare(sql).run(...params) : { lastInsertRowid: 0, changes: 0 })
};
