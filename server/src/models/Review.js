import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
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
    // Review period
    periodStart: {
      type: Date,
      required: [true, 'Data poczatku okresu jest wymagana'],
    },
    periodEnd: {
      type: Date,
      required: [true, 'Data konca okresu jest wymagana'],
    },
    // Review type
    type: {
      type: String,
      enum: {
        values: ['monthly', 'quarterly', 'tournament', 'milestone', 'general'],
        message: 'Nieprawidlowy typ oceny',
      },
      default: 'monthly',
    },
    // Title
    title: {
      type: String,
      required: [true, 'Tytul oceny jest wymagany'],
    },
    // Structured assessment
    strengths: {
      type: String,
      default: '',
    },
    areasToImprove: {
      type: String,
      default: '',
    },
    recommendations: {
      type: String,
      default: '',
    },
    // General notes
    notes: {
      type: String,
      default: '',
    },
    // Skill ratings at time of review (snapshot)
    skillRatings: {
      serve: { type: Number, min: 0, max: 100 },
      forehand: { type: Number, min: 0, max: 100 },
      backhand: { type: Number, min: 0, max: 100 },
      volley: { type: Number, min: 0, max: 100 },
      tactics: { type: Number, min: 0, max: 100 },
      fitness: { type: Number, min: 0, max: 100 },
    },
    // Overall rating 1-5
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    // Visibility
    visibleToParent: {
      type: Boolean,
      default: true,
    },
    // Status
    status: {
      type: String,
      enum: {
        values: ['draft', 'published'],
        message: 'Status musi byc "draft" lub "published"',
      },
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ player: 1, createdAt: -1 });
reviewSchema.index({ coach: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
