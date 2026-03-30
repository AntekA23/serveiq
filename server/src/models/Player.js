import mongoose from 'mongoose';

const skillSchema = {
  score: {
    type: Number,
    min: [0, 'Wynik umiejętności nie może być mniejszy niż 0'],
    max: [100, 'Wynik umiejętności nie może być większy niż 100'],
    default: 0,
  },
  notes: String,
};

const goalSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Treść celu jest wymagana'],
    },
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  { _id: true }
);

const milestoneSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Treść kamienia milowego jest wymagana'],
    },
    date: Date,
    description: String,
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: Date,
  },
  { _id: true }
);

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
    parents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ranking: {
      pzt: Number,
      te: Number,
      wta: Number,
      atp: Number,
    },
    avatarUrl: String,
    skills: {
      serve: skillSchema,
      forehand: skillSchema,
      backhand: skillSchema,
      volley: skillSchema,
      tactics: skillSchema,
      fitness: skillSchema,
    },
    goals: [goalSchema],
    trainingPlan: {
      weeklyGoal: {
        sessionsPerWeek: { type: Number, default: 0 },
        hoursPerWeek: { type: Number, default: 0 },
      },
      scheduledDays: {
        type: [Number],
        default: [],
      },
      weeklySchedule: {
        type: [plannedSessionSchema],
        default: [],
      },
      focus: [String],
      notes: String,
      milestones: [milestoneSchema],
    },
    monthlyRate: Number,
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Player = mongoose.model('Player', playerSchema);

export default Player;
