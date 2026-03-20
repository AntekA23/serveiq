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
      required: [true, 'Trener jest wymagany'],
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
      enum: {
        values: ['hard', 'clay', 'grass', 'indoor'],
        message: 'Nawierzchnia musi być: hard, clay, grass lub indoor',
      },
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
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
