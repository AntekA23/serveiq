import mongoose from 'mongoose';

const wearableDeviceSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rodzic jest wymagany'],
    },
    provider: {
      type: String,
      enum: {
        values: ['whoop', 'garmin'],
        message: 'Dostawca musi być "whoop" lub "garmin"',
      },
      required: [true, 'Dostawca urządzenia jest wymagany'],
    },
    deviceName: {
      type: String,
      required: [true, 'Nazwa urządzenia jest wymagana'],
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
    },
    connected: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
    },
    battery: {
      type: Number,
      min: [0, 'Poziom baterii nie może być mniejszy niż 0'],
      max: [100, 'Poziom baterii nie może być większy niż 100'],
    },
    settings: {
      syncInterval: {
        type: Number,
        default: 15,
      },
      notifications: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const WearableDevice = mongoose.model('WearableDevice', wearableDeviceSchema);

export default WearableDevice;
