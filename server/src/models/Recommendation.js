import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
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
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewSummary',
    },
    type: {
      type: String,
      enum: [
        'pathway-advance',
        'focus-change',
        'activity-suggest',
        'workload-adjust',
        'support-need',
        'general',
      ],
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
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in-progress', 'completed', 'dismissed'],
      default: 'pending',
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

recommendationSchema.index({ player: 1, status: 1 });
recommendationSchema.index({ club: 1, status: 1, priority: -1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
