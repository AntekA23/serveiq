import { Resend } from 'resend';

let resend = null;

const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const isDev = () => process.env.NODE_ENV !== 'production';
const emailFrom = () => process.env.EMAIL_FROM || 'ServeIQ <noreply@serveiq.pl>';

/**
 * Wysyła email - w dev mode loguje do konsoli, w produkcji przez Resend
 */
const sendEmail = async ({ to, subject, html }) => {
  if (isDev()) {
    console.log('\n========== EMAIL (DEV) ==========');
    console.log(`Do: ${to}`);
    console.log(`Temat: ${subject}`);
    console.log(`Treść HTML: ${html.substring(0, 200)}...`);
    console.log('=================================\n');
    return { success: true, dev: true };
  }

  const client = getResend();
  if (!client) {
    console.error('[Email] Brak klucza API Resend - email nie został wysłany');
    return { success: false, error: 'Brak konfiguracji email' };
  }

  try {
    const result = await client.emails.send({
      from: emailFrom(),
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('[Email] Błąd wysyłania:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Zaproszenie dla rodzica do platformy
 */
export const sendInviteEmail = async (to, coachName, playerName, inviteLink) => {
  return sendEmail({
    to,
    subject: `ServeIQ - Zaproszenie do śledzenia postępów ${playerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a73e8;">Witamy w ServeIQ!</h2>
        <p>Trener <strong>${coachName}</strong> zaprasza Cię do śledzenia postępów zawodnika <strong>${playerName}</strong> na platformie ServeIQ.</p>
        <p>Kliknij poniższy przycisk, aby założyć konto i rozpocząć:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #1a73e8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Przyjmij zaproszenie
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link jest ważny przez 7 dni. Jeśli nie spodziewałeś/aś się tego zaproszenia, zignoruj tę wiadomość.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px;">ServeIQ - Platforma coachingu tenisowego</p>
      </body>
      </html>
    `,
  });
};

/**
 * Email resetowania hasła
 */
export const sendResetPasswordEmail = async (to, resetLink) => {
  return sendEmail({
    to,
    subject: 'ServeIQ - Resetowanie hasła',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a73e8;">Resetowanie hasła</h2>
        <p>Otrzymaliśmy prośbę o resetowanie hasła do Twojego konta ServeIQ.</p>
        <p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #1a73e8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Resetuj hasło
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">Link jest ważny przez 1 godzinę. Jeśli nie prosiłeś/aś o reset hasła, zignoruj tę wiadomość.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px;">ServeIQ - Platforma coachingu tenisowego</p>
      </body>
      </html>
    `,
  });
};

/**
 * Faktura / prośba o płatność
 */
export const sendPaymentInvoice = async (to, amount, description, dueDate, payLink) => {
  const formattedDate = new Date(dueDate).toLocaleDateString('pl-PL');
  const formattedAmount = `${amount.toFixed(2)} PLN`;

  return sendEmail({
    to,
    subject: `ServeIQ - Nowa płatność: ${formattedAmount}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a73e8;">Nowa płatność do uregulowania</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Kwota:</strong> ${formattedAmount}</p>
          <p><strong>Opis:</strong> ${description || 'Treningi tenisowe'}</p>
          <p><strong>Termin płatności:</strong> ${formattedDate}</p>
        </div>
        ${payLink ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${payLink}" style="background-color: #1a73e8; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px;">
            Zapłać online
          </a>
        </div>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px;">ServeIQ - Platforma coachingu tenisowego</p>
      </body>
      </html>
    `,
  });
};

/**
 * Przypomnienie o płatności
 */
export const sendPaymentReminder = async (to, amount, description) => {
  const formattedAmount = `${amount.toFixed(2)} PLN`;

  return sendEmail({
    to,
    subject: `ServeIQ - Przypomnienie o płatności: ${formattedAmount}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e53935;">Przypomnienie o płatności</h2>
        <p>Masz zaległą płatność w systemie ServeIQ:</p>
        <div style="background: #fff3f3; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53935;">
          <p><strong>Kwota:</strong> ${formattedAmount}</p>
          <p><strong>Opis:</strong> ${description || 'Treningi tenisowe'}</p>
        </div>
        <p>Prosimy o uregulowanie płatności w najwcześniejszym możliwym terminie.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px;">ServeIQ - Platforma coachingu tenisowego</p>
      </body>
      </html>
    `,
  });
};

/**
 * Potwierdzenie płatności
 */
export const sendPaymentConfirmation = async (to, amount, description) => {
  const formattedAmount = `${amount.toFixed(2)} PLN`;

  return sendEmail({
    to,
    subject: `ServeIQ - Potwierdzenie płatności: ${formattedAmount}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #43a047;">Płatność otrzymana!</h2>
        <p>Potwierdzamy otrzymanie płatności:</p>
        <div style="background: #f1f8f1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #43a047;">
          <p><strong>Kwota:</strong> ${formattedAmount}</p>
          <p><strong>Opis:</strong> ${description || 'Treningi tenisowe'}</p>
        </div>
        <p>Dziękujemy za terminową wpłatę!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="color: #999; font-size: 12px;">ServeIQ - Platforma coachingu tenisowego</p>
      </body>
      </html>
    `,
  });
};
