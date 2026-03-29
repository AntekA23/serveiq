import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled'],
      default: 'planned',
    },
    name: {
      type: String,
      required: [true, 'Nazwa turnieju jest wymagana'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    surface: {
      type: String,
      enum: ['clay', 'hard', 'grass', 'carpet', 'indoor-hard'],
    },
    startDate: {
      type: Date,
      required: [true, 'Data rozpoczęcia jest wymagana'],
    },
    endDate: Date,
    category: String,
    drawSize: Number,
    result: {
      round: String,
      wins: Number,
      losses: Number,
      scores: [String],
      rating: Number,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
