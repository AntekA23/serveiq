import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { sendResetPasswordEmail, sendInviteEmail } from '../services/emailService.js';

// ====== Zod Schemas ======

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  role: z.enum(['coach', 'parent'], { message: 'Rola musi być "coach" lub "parent"' }),
  phone: z.string().optional(),
  coachProfile: z
    .object({
      club: z.string().optional(),
      itfLevel: z.string().optional(),
      bio: z.string().optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
});

const acceptInviteSchema = z.object({
  inviteToken: z.string().min(1, 'Token zaproszenia jest wymagany'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  phone: z.string().optional(),
});

// ====== Pomocnicze ======

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
    path: '/',
  });
};

// ====== Kontrolery ======

/**
 * POST /api/auth/register
 * Rejestracja nowego użytkownika (coach od razu aktywny, parent przez zaproszenie)
 */
export const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    // Sprawdź czy email już istnieje
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ message: 'Użytkownik z tym adresem email już istnieje' });
    }

    const user = await User.create({
      ...data,
      isActive: true,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: 'Konto zostało utworzone',
      user: user.toJSON(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Logowanie: email + hasło → accessToken + refreshToken (cookie)
 */
export const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Konto zostało dezaktywowane' });
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Zalogowano pomyślnie',
      user: user.toJSON(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Odśwież accessToken używając refreshToken z cookie
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Brak tokenu odświeżania' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Nieprawidłowy token odświeżania' });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Token odświeżania został unieważniony' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Konto zostało dezaktywowane' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Usuń refreshToken z cookie i z bazy danych
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.userId) {
        await User.findByIdAndUpdate(decoded.userId, { refreshToken: null });
      }
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ message: 'Wylogowano pomyślnie' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Generuj token resetowania hasła i wyślij email
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email: data.email });

    // Zawsze zwracamy sukces (nie ujawniamy czy email istnieje)
    if (!user) {
      return res.json({
        message: 'Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 godzina
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;

    await sendResetPasswordEmail(user.email, resetLink);

    res.json({
      message: 'Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password/:token
 * Resetuj hasło za pomocą tokenu
 */
export const resetPassword = async (req, res, next) => {
  try {
    const data = resetPasswordSchema.parse(req.body);
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token resetowania hasła jest nieprawidłowy lub wygasł',
      });
    }

    user.password = data.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Hasło zostało zmienione. Możesz się teraz zalogować.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Zwróć dane zalogowanego użytkownika
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpires -inviteToken -inviteExpires')
      .populate('parentProfile.children');

    if (!user) {
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/accept-invite
 * Rodzic ustawia hasło i aktywuje konto przez token zaproszenia
 */
export const acceptInvite = async (req, res, next) => {
  try {
    const data = acceptInviteSchema.parse(req.body);

    const user = await User.findOne({
      inviteToken: data.inviteToken,
      inviteExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token zaproszenia jest nieprawidłowy lub wygasł',
      });
    }

    user.password = data.password;
    user.firstName = data.firstName;
    user.lastName = data.lastName;
    if (data.phone) user.phone = data.phone;
    user.isActive = true;
    user.inviteToken = undefined;
    user.inviteExpires = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Konto zostało aktywowane',
      user: user.toJSON(),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};
