import { z } from 'zod';
import Payment from '../models/Payment.js';
import Player from '../models/Player.js';
import User from '../models/User.js';
import { createCheckoutSession, handleWebhook } from '../services/stripeService.js';
import { sendPaymentConfirmation, sendPaymentInvoice } from '../services/emailService.js';

// ====== Zod Schemas ======

const createPaymentSchema = z.object({
  player: z.string().min(1, 'Zawodnik jest wymagany'),
  parent: z.string().min(1, 'Rodzic jest wymagany'),
  amount: z.number().positive('Kwota musi być dodatnia'),
  currency: z.string().default('PLN'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Termin płatności jest wymagany'),
});

// ====== Kontrolery ======

/**
 * GET /api/payments
 * Coach → wszystkie jego płatności. Parent → jego płatności.
 * Automatyczne oznaczanie overdue.
 */
export const getPayments = async (req, res, next) => {
  try {
    const filter = {};

    if (req.user.role === 'coach') {
      filter.coach = req.user._id;
    } else if (req.user.role === 'parent') {
      filter.parent = req.user._id;
    }

    // Automatyczne oznaczanie przeterminowanych płatności
    const now = new Date();
    await Payment.updateMany(
      {
        ...filter,
        status: 'pending',
        dueDate: { $lt: now },
      },
      { $set: { status: 'overdue' } }
    );

    const payments = await Payment.find(filter)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('parent', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments
 * Coach tworzy nową płatność (fakturę)
 */
export const createPayment = async (req, res, next) => {
  try {
    const data = createPaymentSchema.parse(req.body);

    // Sprawdź czy zawodnik należy do trenera
    const player = await Player.findOne({
      _id: data.player,
      coach: req.user._id,
      active: true,
    });

    if (!player) {
      return res.status(404).json({ message: 'Zawodnik nie znaleziony' });
    }

    // Sprawdź czy rodzic istnieje
    const parent = await User.findOne({
      _id: data.parent,
      role: 'parent',
    });

    if (!parent) {
      return res.status(404).json({ message: 'Rodzic nie znaleziony' });
    }

    const payment = await Payment.create({
      player: data.player,
      coach: req.user._id,
      parent: data.parent,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      dueDate: new Date(data.dueDate),
    });

    // Wyślij email z fakturą
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const payLink = `${clientUrl}/payments/${payment._id}`;

    await sendPaymentInvoice(
      parent.email,
      data.amount,
      data.description || 'Treningi tenisowe',
      data.dueDate,
      payLink
    );

    const populatedPayment = await Payment.findById(payment._id)
      .populate('player', 'firstName lastName')
      .populate('coach', 'firstName lastName')
      .populate('parent', 'firstName lastName email');

    res.status(201).json({
      message: 'Płatność została utworzona',
      payment: populatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/:id/checkout
 * Parent tworzy Stripe Checkout Session
 */
export const createCheckout = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      parent: req.user._id,
      status: { $in: ['pending', 'overdue'] },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Płatność nie znaleziona' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/payments?success=true&paymentId=${payment._id}`;
    const cancelUrl = `${clientUrl}/payments?cancelled=true&paymentId=${payment._id}`;

    const session = await createCheckoutSession(payment, successUrl, cancelUrl);

    // Zapisz ID sesji Stripe
    payment.stripeCheckoutSessionId = session.id;
    await payment.save();

    res.json({ url: session.url });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payments/webhook
 * Stripe webhook handler (checkout.session.completed)
 */
export const webhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = handleWebhook(req.body, sig);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        const payment = await Payment.findById(paymentId).populate('parent', 'email');

        if (payment) {
          payment.status = 'paid';
          payment.paidAt = new Date();
          payment.stripePaymentIntentId = session.payment_intent;
          await payment.save();

          // Wyślij potwierdzenie email
          if (payment.parent?.email) {
            await sendPaymentConfirmation(
              payment.parent.email,
              payment.amount,
              payment.description || 'Treningi tenisowe'
            );
          }
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Błąd:', error.message);
    res.status(400).json({ message: `Błąd webhooka: ${error.message}` });
  }
};

/**
 * GET /api/payments/stats
 * Statystyki przychodów trenera (suma, monthly breakdown)
 */
export const getStats = async (req, res, next) => {
  try {
    // Suma wszystkich opłaconych płatności
    const totalResult = await Payment.aggregate([
      { $match: { coach: req.user._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Rozbicie miesięczne
    const monthlyBreakdown = await Payment.aggregate([
      { $match: { coach: req.user._id, status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$paidAt' },
            month: { $month: '$paidAt' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    // Oczekujące i przeterminowane
    const pendingResult = await Payment.aggregate([
      { $match: { coach: req.user._id, status: { $in: ['pending', 'overdue'] } } },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const pending = pendingResult.find((r) => r._id === 'pending') || { total: 0, count: 0 };
    const overdue = pendingResult.find((r) => r._id === 'overdue') || { total: 0, count: 0 };

    res.json({
      stats: {
        totalPaid: total,
        pending: { total: pending.total, count: pending.count },
        overdue: { total: overdue.total, count: overdue.count },
        monthlyBreakdown: monthlyBreakdown.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          total: m.total,
          count: m.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
