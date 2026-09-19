import { getPool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function login(req, res) {
  try {
    const identifier = req.body.email || req.body.username || req.body.identifier;
    const { password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and password are required' });
    }

    const pool = getPool();
    const [users] = await pool.query('SELECT * FROM users WHERE (email = ? OR auth_identifier = ?) AND active = 1', [identifier, identifier]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'mr_x_change_staff_super_secret_jwt_key_2026',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        auth_identifier: user.auth_identifier
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getProfile(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}
