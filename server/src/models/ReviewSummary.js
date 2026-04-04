import mongoose from 'mongoose';

const reviewSummarySchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    periodType: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'seasonal', 'ad-hoc'],
      default: 'monthly',
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    whatHappened: {
      type: String,
      trim: true,
    },
    whatWentWell: {
      type: String,
      trim: true,
    },
    whatNeedsFocus: {
      type: String,
      trim: true,
    },
    nextSteps: {
      type: String,
      trim: true,
    },
    activitiesCount: {
      type: Number,
      default: 0,
    },
    goalsReviewed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DevelopmentGoal',
      },
    ],
    observations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Observation',
      },
    ],
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    aiDraft: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
    },
    visibleToParent: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSummarySchema.index({ player: 1, periodEnd: -1 });
reviewSummarySchema.index({ club: 1, status: 1 });
reviewSummarySchema.index({ author: 1, createdAt: -1 });

const ReviewSummary = mongoose.model('ReviewSummary', reviewSummarySchema);

export default ReviewSummary;
