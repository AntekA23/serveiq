import { z } from 'zod';
import mongoose from 'mongoose';
import Message from '../models/Message.js';

// ====== Zod Schemas ======

const sendMessageSchema = z.object({
  to: z.string().min(1, 'Odbiorca jest wymagany'),
  text: z.string().min(1, 'Treść wiadomości jest wymagana'),
  player: z.string().optional(),
});

// ====== Kontrolery ======

/**
 * GET /api/messages/conversations
 * Lista unikalnych rozmówców z ostatnią wiadomością i liczbą nieprzeczytanych
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Znajdź wszystkie unikalne rozmówców
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ from: userId }, { to: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        // Utwórz klucz konwersacji (para userów niezależnie od kierunku)
        $addFields: {
          conversationWith: {
            $cond: [{ $eq: ['$from', userId] }, '$to', '$from'],
          },
        },
      },
      {
        $group: {
          _id: '$conversationWith',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$to', userId] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                avatarUrl: 1,
                role: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: '$user',
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
      {
        $project: {
          user: 1,
          lastMessage: {
            text: '$lastMessage.text',
            createdAt: '$lastMessage.createdAt',
            from: '$lastMessage.from',
          },
          unreadCount: 1,
        },
      },
    ]);

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/messages/conversation/:userId
 * Historia wiadomości z danym użytkownikiem
 */
export const getConversation = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const otherUserId = new mongoose.Types.ObjectId(req.params.userId);

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId },
      ],
    })
      .populate('from', 'firstName lastName avatarUrl')
      .populate('to', 'firstName lastName avatarUrl')
      .populate('player', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/messages
 * Wyślij wiadomość
 */
export const sendMessage = async (req, res, next) => {
  try {
    const data = sendMessageSchema.parse(req.body);

    const message = await Message.create({
      from: req.user._id,
      to: data.to,
      text: data.text,
      player: data.player || undefined,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('from', 'firstName lastName avatarUrl')
      .populate('to', 'firstName lastName avatarUrl')
      .populate('player', 'firstName lastName');

    res.status(201).json({
      message: 'Wiadomość została wysłana',
      data: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/messages/read/:userId
 * Oznacz wiadomości od danego użytkownika jako przeczytane
 */
export const markAsRead = async (req, res, next) => {
  try {
    const result = await Message.updateMany(
      {
        from: req.params.userId,
        to: req.user._id,
        read: false,
      },
      { $set: { read: true } }
    );

    res.json({
      message: 'Wiadomości oznaczone jako przeczytane',
      count: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};
