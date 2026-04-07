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
    courts: [
      {
        number: { type: Number, required: true },
        name: { type: String, trim: true },
        surface: {
          type: String,
          enum: ['clay', 'hard', 'grass', 'carpet', 'indoor-hard'],
          required: true,
        },
        indoor: { type: Boolean, default: false },
        lighting: { type: Boolean, default: false },
        heated: { type: Boolean, default: false },
        active: { type: Boolean, default: true },
      },
    ],
    facilities: {
      gym: { available: { type: Boolean, default: false }, description: String },
      squash: { available: { type: Boolean, default: false }, courtsCount: Number, description: String },
      tableTennis: { available: { type: Boolean, default: false }, tablesCount: Number, description: String },
      swimmingPool: { available: { type: Boolean, default: false }, description: String },
      sauna: { available: { type: Boolean, default: false }, description: String },
      changingRooms: { available: { type: Boolean, default: false }, description: String },
      parking: { available: { type: Boolean, default: false }, spacesCount: Number, description: String },
      shop: { available: { type: Boolean, default: false }, description: String },
      cafe: { available: { type: Boolean, default: false }, description: String },
      physio: { available: { type: Boolean, default: false }, description: String },
      other: [
        {
          name: { type: String, required: true },
          description: String,
        },
      ],
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
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
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

function generateClubCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'KLUB-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

clubSchema.pre('save', async function (next) {
  if (!this.inviteCode) {
    let code;
    let exists = true;
    while (exists) {
      code = generateClubCode();
      exists = await mongoose.model('Club').findOne({ inviteCode: code });
    }
    this.inviteCode = code;
  }
  next();
});

clubSchema.index({ name: 1 });
clubSchema.index({ city: 1 });
clubSchema.index({ pztLicense: 1 }, { sparse: true });

const Club = mongoose.model('Club', clubSchema);

export default Club;
