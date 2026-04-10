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
          'review_published',
          'recommendation_new',
          'activity_reminder',
          'pathway_change',
          'observation_added',
          'goal_completed',
          'coach_request_new',
          'coach_request_response',
          'system',
          'stage_transition',
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
