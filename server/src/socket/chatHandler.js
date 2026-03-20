import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';

/**
 * Obsługa czatu w czasie rzeczywistym przez Socket.io
 */
const chatHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.io] Nowe połączenie: ${socket.id}`);

    /**
     * Dołączenie do pokoju użytkownika
     * Client emituje: socket.emit('join', userId)
     */
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`[Socket.io] Użytkownik ${userId} dołączył do pokoju`);
    });

    /**
     * Wysyłanie wiadomości
     * Client emituje: socket.emit('message', { token, to, text, player? })
     */
    socket.on('message', async (data) => {
      try {
        const { token, to, text, player } = data;

        if (!token || !to || !text) {
          socket.emit('error', { message: 'Brak wymaganych danych (token, to, text)' });
          return;
        }

        // Weryfikuj JWT
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          socket.emit('error', { message: 'Nieprawidłowy token autoryzacji' });
          return;
        }

        const fromUserId = decoded.userId;

        // Zapisz wiadomość do bazy danych
        const message = await Message.create({
          from: fromUserId,
          to,
          text,
          player: player || undefined,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('from', 'firstName lastName avatarUrl')
          .populate('to', 'firstName lastName avatarUrl')
          .populate('player', 'firstName lastName');

        // Emituj wiadomość do odbiorcy
        io.to(to).emit('message', populatedMessage);

        // Emituj potwierdzenie do nadawcy
        io.to(fromUserId).emit('message', populatedMessage);
      } catch (error) {
        console.error('[Socket.io] Błąd wysyłania wiadomości:', error.message);
        socket.emit('error', { message: 'Błąd wysyłania wiadomości' });
      }
    });

    /**
     * Oznaczanie wiadomości jako przeczytanych
     * Client emituje: socket.emit('read', { token, fromUserId })
     */
    socket.on('read', async (data) => {
      try {
        const { token, fromUserId } = data;

        if (!token || !fromUserId) {
          socket.emit('error', { message: 'Brak wymaganych danych (token, fromUserId)' });
          return;
        }

        // Weryfikuj JWT
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
          socket.emit('error', { message: 'Nieprawidłowy token autoryzacji' });
          return;
        }

        const toUserId = decoded.userId;

        // Oznacz wiadomości jako przeczytane
        await Message.updateMany(
          { from: fromUserId, to: toUserId, read: false },
          { $set: { read: true } }
        );

        // Emituj potwierdzenie do nadawcy (żeby wiedział, że odbiorca przeczytał)
        io.to(fromUserId).emit('read', {
          by: toUserId,
          fromUserId,
        });
      } catch (error) {
        console.error('[Socket.io] Błąd oznaczania jako przeczytane:', error.message);
        socket.emit('error', { message: 'Błąd oznaczania wiadomości jako przeczytane' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Rozłączono: ${socket.id}`);
    });
  });
};

export default chatHandler;
