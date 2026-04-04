import mongoose from 'mongoose';

const observationSchema = new mongoose.Schema(
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
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['progress', 'concern', 'highlight', 'participation', 'general'],
      default: 'general',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    engagement: {
      type: Number,
      min: 1,
      max: 5,
    },
    effort: {
      type: Number,
      min: 1,
      max: 5,
    },
    mood: {
      type: Number,
      min: 1,
      max: 5,
    },
    focusAreas: [String],
    goalRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DevelopmentGoal',
    },
    visibleToParent: {
      type: Boolean,
      default: true,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

observationSchema.index({ player: 1, createdAt: -1 });
observationSchema.index({ activity: 1 });
observationSchema.index({ author: 1, createdAt: -1 });
observationSchema.index({ player: 1, type: 1 });

const Observation = mongoose.model('Observation', observationSchema);

export default Observation;
