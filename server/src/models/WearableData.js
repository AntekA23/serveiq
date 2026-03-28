import mongoose from 'mongoose';

const wearableDataSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: [true, 'Zawodnik jest wymagany'],
    },
    device: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WearableDevice',
      required: [true, 'Urządzenie jest wymagane'],
    },
    provider: {
      type: String,
      enum: {
        values: ['whoop', 'garmin'],
        message: 'Dostawca musi być "whoop" lub "garmin"',
      },
      required: [true, 'Dostawca jest wymagany'],
    },
    date: {
      type: Date,
      required: [true, 'Data jest wymagana'],
    },
    type: {
      type: String,
      enum: {
        values: ['daily_summary', 'workout', 'sleep', 'recovery'],
        message: 'Typ musi być "daily_summary", "workout", "sleep" lub "recovery"',
      },
      required: [true, 'Typ danych jest wymagany'],
    },
    metrics: {
      heartRate: {
        resting: Number,
        max: Number,
        avg: Number,
      },
      hrv: {
        value: Number,
        trend: {
          type: String,
          enum: {
            values: ['up', 'down', 'stable'],
            message: 'Trend HRV musi być "up", "down" lub "stable"',
          },
        },
      },
      sleep: {
        totalMinutes: Number,
        deepMinutes: Number,
        remMinutes: Number,
        lightMinutes: Number,
        awakeMinutes: Number,
        quality: Number,
        bedtime: String,
        wakeTime: String,
      },
      strain: {
        value: Number,
        calories: Number,
        activityMinutes: Number,
      },
      recovery: {
        score: Number,
        status: {
          type: String,
          enum: {
            values: ['green', 'yellow', 'red'],
            message: 'Status regeneracji musi być "green", "yellow" lub "red"',
          },
        },
        recommendation: String,
      },
      activity: {
        steps: Number,
        distance: Number,
        activeMinutes: Number,
        calories: Number,
        trainingLoad: Number,
        vo2max: Number,
      },
      stress: {
        avg: Number,
        max: Number,
        restMinutes: Number,
      },
      bodyBattery: {
        current: Number,
        high: Number,
        low: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indeksy dla szybkich zapytań
wearableDataSchema.index({ player: 1, date: -1 });
wearableDataSchema.index({ player: 1, type: 1, date: -1 });

const WearableData = mongoose.model('WearableData', wearableDataSchema);

export default WearableData;
