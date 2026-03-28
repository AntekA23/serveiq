import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Użytkownik jest wymagany'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'health_alert',
          'recovery_low',
          'recovery_high',
          'milestone',
          'weekly_summary',
          'device_disconnected',
          'sync_error',
          'system',
        ],
        message: 'Nieprawidłowy typ powiadomienia',
      },
      required: [true, 'Typ powiadomienia jest wymagany'],
    },
    title: {
      type: String,
      required: [true, 'Tytuł powiadomienia jest wymagany'],
    },
    body: {
      type: String,
      required: [true, 'Treść powiadomienia jest wymagana'],
    },
    severity: {
      type: String,
      enum: {
        values: ['info', 'warning', 'critical'],
        message: 'Priorytet musi być "info", "warning" lub "critical"',
      },
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
    actionUrl: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
