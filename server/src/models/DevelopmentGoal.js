import mongoose from 'mongoose';

const developmentGoalSchema = new mongoose.Schema(
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    category: {
      type: String,
      enum: [
        'fundamentals',
        'movement',
        'consistency',
        'confidence',
        'match-routines',
        'recovery',
        'school-balance',
        'fitness',
        'tactics',
        'serve',
        'pathway',
        'other',
      ],
      default: 'fundamentals',
    },
    timeframe: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'seasonal', 'yearly'],
      default: 'monthly',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    targetDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused', 'dropped'],
      default: 'active',
    },
    completedAt: {
      type: Date,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    visibleToParent: {
      type: Boolean,
      default: true,
    },
    visibleToPlayer: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

developmentGoalSchema.index({ player: 1, status: 1 });
developmentGoalSchema.index({ club: 1, category: 1 });

const DevelopmentGoal = mongoose.model('DevelopmentGoal', developmentGoalSchema);

export default DevelopmentGoal;
