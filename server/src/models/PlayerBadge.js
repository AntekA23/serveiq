import mongoose from 'mongoose';

const playerBadgeSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    badgeSlug: {
      type: String,
      required: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'automatic',
    },
    awardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    awardedNote: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

playerBadgeSchema.index({ player: 1, badgeSlug: 1 }, { unique: true });

const PlayerBadge = mongoose.model('PlayerBadge', playerBadgeSchema);

export default PlayerBadge;
