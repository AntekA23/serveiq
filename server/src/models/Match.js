import mongoose from 'mongoose';

const setSchema = new mongoose.Schema(
  {
    playerScore: { type: Number, required: true, min: 0 },
    opponentScore: { type: Number, required: true, min: 0 },
    tiebreak: { type: Number, min: 0 },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    date: { type: Date, required: [true, 'Data jest wymagana'] },
    surface: {
      type: String,
      enum: ['clay', 'hard', 'indoor-hard', 'grass'],
    },
    durationMinutes: Number,
    round: {
      type: String,
      enum: ['sparing', 'qualif', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'final-3rd-place'],
      default: 'sparing',
    },
    opponent: {
      name: { type: String, required: [true, 'Imię rywalki jest wymagane'], trim: true },
      club: String,
      isInternal: { type: Boolean, default: false },
      playerRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      ranking: {
        pzt: Number,
        te: Number,
        itf: Number,
        wta: Number,
        atp: Number,
      },
    },
    scoutingNotes: { type: String, trim: true },
    result: {
      won: { type: Boolean, required: true },
      sets: { type: [setSchema], default: [] },
      retired: { type: Boolean, default: false },
      walkover: { type: Boolean, default: false },
    },
    stats: {
      firstServePct: Number,
      secondServePct: Number,
      aces: Number,
      doubleFaults: Number,
      winners: Number,
      unforcedErrors: Number,
      breakPointsConverted: Number,
      breakPointsFaced: Number,
      breakPointsSaved: Number,
    },
    keyMoments: { type: [String], default: [] },
    coachDebrief: { type: String, trim: true },
    mentalState: { type: Number, min: 1, max: 5 },
    visibleToParent: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

matchSchema.index({ player: 1, date: -1 });
matchSchema.index({ player: 1, tournament: 1 });
matchSchema.index({ 'opponent.name': 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;
