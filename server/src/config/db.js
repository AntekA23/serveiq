import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Połączono z bazą danych: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Błąd połączenia: ${error.message}`);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[MongoDB] Błąd połączenia: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Połączenie z bazą danych zostało przerwane');
  });
};

export default connectDB;
