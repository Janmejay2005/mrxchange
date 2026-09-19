import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // For convenience in staff development if no token is provided, assign default staff user
    req.user = {
      id: 'default-staff-id',
      name: 'Aadarsh Sharma',
      email: 'staff@mrx.com',
      role: 'STAFF'
    };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'mr_x_change_staff_super_secret_jwt_key_2026', (err, user) => {
    if (err) {
      req.user = {
        id: 'default-staff-id',
        name: 'Aadarsh Sharma',
        email: 'staff@mrx.com',
        role: 'STAFF'
      };
      return next();
    }
    req.user = user;
    next();
  });
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (typeof roles === 'string') roles = [roles];
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}
