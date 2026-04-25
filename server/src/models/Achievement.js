import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
    },
    category: {
      type: String,
      enum: ['mp', 'international', 'national', 'ranking', 'callup', 'other'],
      required: [true, 'Kategoria osiągnięcia jest wymagana'],
    },
    title: {
      type: String,
      required: [true, 'Tytuł osiągnięcia jest wymagany'],
      trim: true,
    },
    ageCategory: {
      type: String,
      enum: ['U10', 'U12', 'U14', 'U16', 'U18', 'open'],
    },
    discipline: {
      type: String,
      enum: ['singel', 'debel', 'mix', 'druzynowe'],
      default: 'singel',
    },
    year: {
      type: Number,
      required: [true, 'Rok jest wymagany'],
    },
    date: Date,
    location: { type: String, trim: true },
    result: {
      type: String,
      enum: ['gold', 'silver', 'bronze', 'finalist', 'semifinal', 'quarterfinal', 'other'],
      required: [true, 'Wynik jest wymagany'],
    },
    description: { type: String, trim: true },
    imageUrl: String,
    visibleToParent: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

achievementSchema.index({ player: 1, year: -1 });
achievementSchema.index({ player: 1, category: 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

export default Achievement;
