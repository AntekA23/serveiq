import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    type: {
      type: String,
      enum: ['class', 'camp', 'tournament', 'training', 'match', 'fitness', 'review', 'other'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    location: {
      type: String,
      trim: true,
    },
    surface: {
      type: String,
      enum: ['clay', 'hard', 'grass', 'carpet', 'indoor-hard', ''],
      default: '',
    },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled'],
      default: 'planned',
    },
    focusAreas: [String],
    notes: {
      type: String,
      trim: true,
    },
    parentNotes: {
      type: String,
      trim: true,
    },
    tournamentData: {
      category: String,
      drawSize: Number,
      result: {
        round: String,
        wins: Number,
        losses: Number,
        scores: [String],
      },
    },
    attendance: [
      {
        player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        status: {
          type: String,
          enum: ['present', 'absent', 'late', 'excused'],
          default: 'present',
        },
      },
    ],
    visibleToParent: {
      type: Boolean,
      default: true,
    },
    tags: [String],
    // Recurrence
    recurrence: {
      type: {
        type: String,
        enum: ['none', 'weekly', 'biweekly', 'monthly'],
        default: 'none',
      },
      seriesId: {
        type: String,
      },
      parentActivityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
      },
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ club: 1, date: -1 });
activitySchema.index({ players: 1, date: -1 });
activitySchema.index({ coach: 1, date: -1 });
activitySchema.index({ group: 1, date: -1 });
activitySchema.index({ type: 1, date: -1 });
activitySchema.index({ club: 1, type: 1, status: 1 });
activitySchema.index({ 'recurrence.seriesId': 1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
