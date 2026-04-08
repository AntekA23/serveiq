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
  },
  { timestamps: true }
);

playerBadgeSchema.index({ player: 1, badgeSlug: 1 }, { unique: true });

const PlayerBadge = mongoose.model('PlayerBadge', playerBadgeSchema);

export default PlayerBadge;
