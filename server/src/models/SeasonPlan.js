import mongoose from 'mongoose';

const phaseSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['build', 'peak', 'taper', 'recovery', 'offseason'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    intensity: { type: Number, min: 1, max: 5, default: 3 },
    targetEvent: String,
    notes: String,
  },
  { _id: true }
);

const targetEventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    date: { type: Date, required: true },
    priority: { type: String, enum: ['A', 'B', 'C'], required: true },
    tournamentRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
  },
  { _id: true }
);

const seasonPlanSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true,
    },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    season: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    weeklyHoursTarget: { type: Number, min: 0 },
    phases: { type: [phaseSchema], default: [] },
    targetEvents: { type: [targetEventSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

seasonPlanSchema.index({ player: 1, season: 1, status: 1 });
seasonPlanSchema.index({ player: 1, status: 1 });

const SeasonPlan = mongoose.model('SeasonPlan', seasonPlanSchema);
export default SeasonPlan;
