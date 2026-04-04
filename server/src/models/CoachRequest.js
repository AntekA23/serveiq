import mongoose from 'mongoose'

const coachRequestSchema = new mongoose.Schema({
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true })

coachRequestSchema.index({ coach: 1, status: 1 })
coachRequestSchema.index({ parent: 1 })
coachRequestSchema.index({ parent: 1, coach: 1, status: 1 })

const CoachRequest = mongoose.model('CoachRequest', coachRequestSchema)
export default CoachRequest
