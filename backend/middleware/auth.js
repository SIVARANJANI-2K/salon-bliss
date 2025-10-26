import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Support either { id: userId } or { userId } token shapes
  const userId = decoded.id || decoded.userId || decoded._id;
  const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};