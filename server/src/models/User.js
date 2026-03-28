import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email jest wymagany'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Hasło jest wymagane'],
      minlength: [6, 'Hasło musi mieć minimum 6 znaków'],
    },
    role: {
      type: String,
      enum: {
        values: ['coach', 'parent'],
        message: 'Rola musi być "coach" lub "parent"',
      },
      required: [true, 'Rola jest wymagana'],
    },
    firstName: {
      type: String,
      required: [true, 'Imię jest wymagane'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Nazwisko jest wymagane'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatarUrl: String,

    // Profil trenera
    coachProfile: {
      club: String,
      itfLevel: String,
      bio: String,
    },

    // Profil rodzica
    parentProfile: {
      children: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Player',
        },
      ],
    },

    refreshToken: String,

    resetPasswordToken: String,
    resetPasswordExpires: Date,

    inviteToken: String,
    inviteExpires: Date,

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    subscription: {
      plan: {
        type: String,
        enum: ['free', 'premium', 'family'],
        default: 'premium',
      },
      status: {
        type: String,
        enum: ['trialing', 'active', 'past_due', 'cancelled', 'expired'],
        default: 'trialing',
      },
      stripeCustomerId: String,
      stripeSubscriptionId: String,
      trialEndsAt: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
    },

    notificationSettings: {
      recoveryThresholdCritical: { type: Number, default: 33 },
      recoveryThresholdWarning: { type: Number, default: 50 },
      minSleepHours: { type: Number, default: 6 },
      hrvDropThreshold: { type: Number, default: 15 },
      weeklyEmail: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      quietHoursStart: { type: String, default: '22:00' },
      quietHoursEnd: { type: String, default: '07:00' },
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

// Pre-save hook: hashuj hasło jeśli zostało zmodyfikowane + ustaw trial dla nowych rodziców
userSchema.pre('save', async function (next) {
  try {
    // Ustaw trial dla nowych rodziców
    if (this.isNew && this.role === 'parent') {
      this.subscription = {
        plan: 'premium',
        status: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      };
    }

    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Metoda do porównywania hasła
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Nie zwracaj hasła i refreshToken w JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.inviteToken;
  delete obj.inviteExpires;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
