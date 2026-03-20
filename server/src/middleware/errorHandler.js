import { ZodError } from 'zod';

/**
 * Globalny handler błędów.
 * Obsługuje: Zod validation, Mongoose validation, JWT errors, domyślne 500.
 */
const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', err);

  // Błędy walidacji Zod
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      pole: e.path.join('.'),
      komunikat: e.message,
    }));
    return res.status(400).json({
      message: 'Błąd walidacji danych',
      errors,
    });
  }

  // Błędy walidacji Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      pole: e.path,
      komunikat: e.message,
    }));
    return res.status(400).json({
      message: 'Błąd walidacji danych',
      errors,
    });
  }

  // Duplikat klucza Mongoose (np. email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `Wartość pola "${field}" już istnieje w bazie danych`,
    });
  }

  // Błędy JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Nieprawidłowy token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token wygasł' });
  }

  // Mongoose CastError (np. nieprawidłowe ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Nieprawidłowy identyfikator zasobu' });
  }

  // Domyślny błąd serwera
  const statusCode = err.statusCode || 500;
  const response = {
    message: err.message || 'Wewnętrzny błąd serwera',
  };

  // W trybie developerskim dodaj stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
