import { z } from 'zod';
import BetaSignup from '../models/BetaSignup.js';

// ====== Zod Schemas ======

const signupSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidlowy adres email'),
  firstName: z.string().optional(),
  source: z.string().optional(),
});

// ====== Kontrolery ======

/**
 * POST /api/beta/signup
 * Rejestracja na liste beta
 */
export const signup = async (req, res, next) => {
  try {
    const { email, firstName, source } = signupSchema.parse(req.body);

    // Sprawdz czy juz zapisany
    const existing = await BetaSignup.findOne({ email });
    if (existing) {
      return res.status(200).json({
        message: 'Ten email jest juz zapisany na liste',
        alreadyExists: true,
      });
    }

    const betaSignup = await BetaSignup.create({
      email,
      firstName: firstName || undefined,
      source: source || 'landing',
    });

    res.status(201).json({
      message: 'Zapisano na liste',
      signup: {
        email: betaSignup.email,
        createdAt: betaSignup.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        message: 'Ten email jest juz zapisany na liste',
        alreadyExists: true,
      });
    }
    next(error);
  }
};

/**
 * GET /api/beta/list
 * Lista zapisanych na beta (admin)
 */
export const list = async (req, res, next) => {
  try {
    const signups = await BetaSignup.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      signups,
      total: signups.length,
    });
  } catch (error) {
    next(error);
  }
};
