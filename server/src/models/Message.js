import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Nadawca jest wymagany'],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Odbiorca jest wymagany'],
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
    text: {
      type: String,
      required: [true, 'Treść wiadomości jest wymagana'],
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indeksy dla szybszego wyszukiwania konwersacji
messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, read: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
