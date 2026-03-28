import { z } from 'zod';
import Notification from '../models/Notification.js';

// ====== Zod Schemas ======

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const idParamSchema = z.object({
  id: z.string().min(1, 'ID powiadomienia jest wymagane'),
});

// ====== Kontrolery ======

/**
 * GET /api/notifications
 * Lista powiadomien uzytkownika (paginowana, posortowana po dacie malejaco)
 */
export const getNotifications = async (req, res, next) => {
  try {
    const { limit, offset } = paginationSchema.parse(req.query);

    const notifications = await Notification.find({ user: req.user._id })
      .populate('player', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Notification.countDocuments({ user: req.user._id });

    res.json({
      notifications,
      total,
      limit,
      offset,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/notifications/unread-count
 * Liczba nieprzeczytanych powiadomien
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read
 * Oznacz powiadomienie jako przeczytane
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Powiadomienie nie znalezione' });
    }

    res.json({ message: 'Oznaczono jako przeczytane', notification });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all
 * Oznacz wszystkie powiadomienia jako przeczytane
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'Wszystkie powiadomienia oznaczono jako przeczytane' });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/notifications/:id
 * Usun powiadomienie
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = idParamSchema.parse(req.params);

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Powiadomienie nie znalezione' });
    }

    res.json({ message: 'Powiadomienie zostalo usuniete' });
  } catch (error) {
    next(error);
  }
};
