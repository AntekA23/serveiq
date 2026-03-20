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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: hashuj hasło jeśli zostało zmodyfikowane
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
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
