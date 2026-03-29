import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    source: {
      type: String,
      enum: ['coach', 'parent'],
      default: 'coach',
    },
    date: {
      type: Date,
      required: [true, 'Data treningu jest wymagana'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Czas trwania treningu jest wymagany'],
    },
    title: {
      type: String,
      required: [true, 'Tytuł treningu jest wymagany'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    focusAreas: [String],
    skillUpdates: [
      {
        skill: String,
        scoreBefore: Number,
        scoreAfter: Number,
      },
    ],
    visibleToParent: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
