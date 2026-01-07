const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id',
      [username, email, hashedPassword]
    );
    return result.rows[0].user_id;
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  // Find user by ID
  static async findById(userId) {
    const result = await db.query(
      'SELECT user_id, username, email, created_at FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user
  static async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramCounter = 1;

    if (updates.username) {
      fields.push(`username = $${paramCounter++}`);
      values.push(updates.username);
    }
    if (updates.email) {
      fields.push(`email = $${paramCounter++}`);
      values.push(updates.email);
    }
    if (updates.password) {
      fields.push(`password = $${paramCounter++}`);
      values.push(await bcrypt.hash(updates.password, 10));
    }

    if (fields.length === 0) return false;

    values.push(userId);
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE user_id = $${paramCounter}`,
      values
    );
    return result.rowCount > 0;
  }

  // Delete user
  static async delete(userId) {
    const result = await db.query(
      'DELETE FROM users WHERE user_id = $1',
      [userId]
    );
    return result.rowCount > 0;
  }
}

module.exports = User;
