import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    namePl: { type: String, required: true },
    ageRange: {
      boys: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      girls: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
    },
    recommendations: {
      totalHoursPerWeek: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      onCourtHours: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      physicalHours: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      competitionHours: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      restDaysPerWeek: { type: Number, required: true },
    },
    multiSportRecommended: { type: Boolean, default: false },
    focusAreas: [String],
    principles: { type: String, required: true },
    trainingDistribution: {
      onCourt: Number,
      physical: Number,
      competition: Number,
      mentalRecovery: Number,
    },
  },
  { _id: true }
);

const developmentProgramSchema = new mongoose.Schema(
  {
    federationCode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    federationName: { type: String, required: true },
    fullName: { type: String, required: true },
    country: { type: String, required: true },
    countryFlag: { type: String, required: true },
    description: { type: String, required: true },
    stages: [stageSchema],
    genderNotes: String,
    source: String,
  },
  { timestamps: true }
);

const DevelopmentProgram = mongoose.model('DevelopmentProgram', developmentProgramSchema);

export default DevelopmentProgram;
