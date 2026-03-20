import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
    },
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: [true, 'Kwota jest wymagana'],
    },
    currency: {
      type: String,
      default: 'PLN',
    },
    description: String,
    dueDate: Date,
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'overdue', 'cancelled'],
        message: 'Status musi być: pending, paid, overdue lub cancelled',
      },
      default: 'pending',
    },
    stripePaymentIntentId: String,
    stripeCheckoutSessionId: String,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
