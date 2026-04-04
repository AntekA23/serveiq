import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pathwayStage: {
      type: String,
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
      },
    ],
    schedule: {
      dayOfWeek: [{ type: Number, min: 0, max: 6 }],
      startTime: String,
      endTime: String,
      surface: String,
    },
    maxPlayers: {
      type: Number,
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

groupSchema.index({ club: 1 });
groupSchema.index({ coach: 1 });

const Group = mongoose.model('Group', groupSchema);

export default Group;
