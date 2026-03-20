import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Weryfikuje JWT z nagłówka Authorization: Bearer <token>
 * Ustawia req.user z danymi użytkownika (bez hasła)
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({ message: 'Użytkownik nie istnieje' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Konto zostało dezaktywowane' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Nieprawidłowy token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token wygasł' });
    }
    next(error);
  }
};

/**
 * Middleware sprawdzający rolę użytkownika.
 * Użycie: requireRole('coach') lub requireRole('coach', 'parent')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Wymagane zalogowanie' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Brak uprawnień. Wymagana rola: ${roles.join(' lub ')}`,
      });
    }

    next();
  };
};

/**
 * Opcjonalna autoryzacja - nie blokuje requestu,
 * ale dodaje req.user jeśli token jest prawidłowy
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshToken');

    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // Token nieprawidłowy - kontynuuj bez użytkownika
  }

  next();
};
