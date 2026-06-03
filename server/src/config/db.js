import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;

  if (!uri) {
    console.error('[MongoDB] Brak adresu bazy — ustaw MONGO_URL (lub MONGODB_URI) w zmiennych środowiskowych');
    process.exit(1);
  }

  // Log the target host without leaking credentials, to aid diagnosis.
  try {
    const host = uri.replace(/\/\/[^@]*@/, '//').replace(/\?.*$/, '');
    console.log(`[MongoDB] Łączenie z: ${host}`);
  } catch { /* ignore */ }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Połączono z bazą danych: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Błąd połączenia: ${error.message}`);
    console.error('[MongoDB] Najczęstsza przyczyna na Railway+Atlas: brak 0.0.0.0/0 w Network Access lub uśpiony klaster.');
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
