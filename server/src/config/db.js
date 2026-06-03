import mongoose from 'mongoose';

// Register connection listeners once (not on every retry).
mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB] Błąd połączenia: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Połączenie z bazą danych zostało przerwane');
});

/**
 * Attempt a single connection. Returns true on success, false on failure.
 * Never calls process.exit — the caller decides whether to retry, so a missing
 * or unreachable database degrades the app instead of crash-looping the container.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;

  if (!uri) {
    console.error('[MongoDB] Brak adresu bazy — ustaw MONGO_URL (lub MONGODB_URI) w zmiennych środowiskowych');
    return false;
  }

  // Log the target host without leaking credentials, to aid diagnosis.
  try {
    const host = uri.replace(/\/\/[^@]*@/, '//').replace(/\?.*$/, '');
    console.log(`[MongoDB] Łączenie z: ${host}`);
  } catch { /* ignore */ }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Połączono z bazą danych: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Błąd połączenia: ${error.message}`);
    console.error('[MongoDB] Najczęstsza przyczyna na Railway+Atlas: brak 0.0.0.0/0 w Network Access lub uśpiony klaster.');
    return false;
  }
};

export default connectDB;
