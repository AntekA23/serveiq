import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shortName: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    pztLicense: {
      type: String,
    },
    pztCertified: {
      type: Boolean,
      default: false,
    },
    surfaces: [
      {
        type: String,
        enum: ['clay', 'hard', 'grass', 'carpet', 'indoor-hard'],
      },
    ],
    courtsCount: {
      type: Number,
    },
    pathwayStages: [
      {
        name: { type: String, required: true },
        order: { type: Number, required: true },
        description: { type: String },
        ageRange: { min: Number, max: Number },
        color: { type: String },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    coaches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    settings: {
      defaultCurrency: { type: String, default: 'PLN' },
      timezone: { type: String, default: 'Europe/Warsaw' },
      language: { type: String, default: 'pl' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

clubSchema.index({ name: 1 });
clubSchema.index({ city: 1 });
clubSchema.index({ pztLicense: 1 }, { sparse: true });

const Club = mongoose.model('Club', clubSchema);

export default Club;
