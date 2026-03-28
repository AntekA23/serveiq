import mongoose from 'mongoose';

const betaSignupSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email jest wymagany'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  firstName: {
    type: String,
    trim: true,
  },
  source: {
    type: String,
    default: 'landing',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('BetaSignup', betaSignupSchema);
