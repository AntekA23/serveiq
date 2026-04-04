import mongoose from 'mongoose';

const skillSchema = {
  score: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  notes: String,
};

const plannedSessionSchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    sessionType: {
      type: String,
      enum: ['kort', 'sparing', 'kondycja', 'rozciaganie', 'mecz', 'inne'],
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 300,
    },
    startTime: String,
    notes: String,
  },
  { _id: true }
);

const playerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Imię zawodnika jest wymagane'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Nazwisko zawodnika jest wymagane'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: ['M', 'F'],
        message: 'Płeć musi być "M" lub "F"',
      },
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    coaches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    parents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],

    // Pathway
    pathwayStage: { type: String },
    pathwayHistory: [{
      stage: String,
      startDate: Date,
      endDate: Date,
      notes: String,
    }],
    developmentLevel: {
      type: String,
      enum: ['beginner', 'tennis10', 'committed', 'advanced', 'performance'],
      default: 'beginner',
    },

    ranking: {
      pzt: Number,
      te: Number,
      wta: Number,
      atp: Number,
    },
    avatarUrl: String,
    // Prośba o dołączenie do trenera
    coachRequest: {
      coach: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      message: String,
      createdAt: { type: Date, default: Date.now },
    },
    skills: {
      serve: skillSchema,
      forehand: skillSchema,
      backhand: skillSchema,
      volley: skillSchema,
      movement: skillSchema,
      tactics: skillSchema,
      mental: skillSchema,
      fitness: skillSchema,
    },
    trainingPlan: {
      weeklyGoal: {
        sessionsPerWeek: { type: Number, default: 3 },
        hoursPerWeek: { type: Number, default: 4 },
      },
      weeklySchedule: {
        type: [plannedSessionSchema],
        default: [],
      },
      focus: [String],
      notes: String,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

playerSchema.index({ club: 1, pathwayStage: 1 });
playerSchema.index({ coach: 1 });
playerSchema.index({ 'parents': 1 });
playerSchema.index({ club: 1, active: 1 });
playerSchema.index({ coaches: 1 });

const Player = mongoose.model('Player', playerSchema);

export default Player;
