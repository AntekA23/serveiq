import User from '../models/User.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Notification from '../models/Notification.js';

/**
 * Formatuje date do polskiego formatu
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Wysyla tygodniowe podsumowania do rodzicow.
 */
export async function sendWeeklySummaries() {
  console.log('[WeeklyEmail] Rozpoczynam wysylanie tygodniowych podsumowań...');

  try {
    // Znajdz aktywnych rodzicow z wlaczonym weeklyEmail
    const parents = await User.find({
      role: 'parent',
      isActive: true,
      'notificationSettings.weeklyEmail': { $ne: false },
    });

    if (!parents.length) {
      console.log('[WeeklyEmail] Brak rodzicow z wlaczonym podsumowaniem tygodniowym.');
      return;
    }

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(0, 0, 0, 0);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

    let sentCount = 0;

    for (const parent of parents) {
      // Znajdz dzieci tego rodzica
      const children = await Player.find({
        parents: parent._id,
        active: true,
      });

      if (!children.length) continue;

      let childrenHtml = '';

      for (const child of children) {
        const childName = `${child.firstName} ${child.lastName}`;

        // Treningi w tym tygodniu
        const sessions = await Session.find({
          player: child._id,
          date: { $gte: weekStart, $lt: weekEnd },
        });
        const sessionCount = sessions.length;

        // Oblicz laczny czas treningow
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const totalHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        childrenHtml += `
          <div style="background: #1A1F2E; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h3 style="color: #CCFF00; margin: 0 0 16px 0; font-size: 18px;">${childName}</h3>
            <p style="color: #8B92A5; margin: 0 0 16px 0; font-size: 13px;">
              ${formatDate(weekStart)} - ${formatDate(weekEnd)}
            </p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Treningi</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${sessionCount} sesji
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Laczny czas</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${totalHours}h ${remainingMinutes}min
                </td>
              </tr>
            </table>
          </div>
        `;
      }

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0B0E14; color: #F0F2F5;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #CCFF00; font-size: 24px; margin: 0;">ServeIQ</h1>
            <p style="color: #8B92A5; font-size: 14px; margin: 4px 0 0;">Tygodniowe podsumowanie</p>
          </div>

          <p style="color: #F0F2F5; font-size: 15px;">
            Czesc ${parent.firstName}! Oto podsumowanie ostatniego tygodnia:
          </p>

          ${childrenHtml}

          <div style="text-align: center; margin-top: 24px;">
            <a href="${CLIENT_URL}/parent/dashboard" style="display: inline-block; background: #CCFF00; color: #0B0E14; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-size: 15px; font-weight: 600;">
              Zobacz pelne statystyki
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 32px;" />
          <p style="color: #505870; font-size: 12px; text-align: center;">
            ServeIQ - Platforma coachingu tenisowego<br/>
            Otrzymujesz ten email, poniewaz masz wlaczone tygodniowe podsumowania.
          </p>
        </body>
        </html>
      `;

      // Wyslij email (w dev mode loguje do konsoli)
      try {
        const { Resend } = await import('resend').catch(() => ({ Resend: null }));
        const isDev = process.env.NODE_ENV !== 'production';
        const emailFrom = process.env.EMAIL_FROM || 'ServeIQ <noreply@serveiq.pl>';

        if (isDev) {
          console.log('\n========== WEEKLY EMAIL (DEV) ==========');
          console.log(`Do: ${parent.email}`);
          console.log(`Temat: ServeIQ - Tygodniowe podsumowanie`);
          console.log(`Tresc: ${emailHtml.substring(0, 300)}...`);
          console.log('=========================================\n');
        } else if (Resend && process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: emailFrom,
            to: parent.email,
            subject: 'ServeIQ - Tygodniowe podsumowanie',
            html: emailHtml,
          });
        }

        sentCount++;
      } catch (emailError) {
        console.error(`[WeeklyEmail] Blad wysylania do ${parent.email}:`, emailError.message);
      }

      // Utworz powiadomienie systemowe
      await Notification.create({
        user: parent._id,
        type: 'system',
        title: 'Tygodniowe podsumowanie',
        body: `Podsumowanie tygodnia ${formatDate(weekStart)} - ${formatDate(weekEnd)} zostalo wyslane na ${parent.email}.`,
        severity: 'info',
        actionUrl: '/parent/dashboard',
      });
    }

    console.log(`[WeeklyEmail] Wyslano ${sentCount} podsumowań tygodniowych.`);
  } catch (error) {
    console.error('[WeeklyEmail] Krytyczny blad:', error.message);
  }
}
