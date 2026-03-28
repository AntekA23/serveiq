import User from '../models/User.js';
import Player from '../models/Player.js';
import WearableData from '../models/WearableData.js';
import Session from '../models/Session.js';
import Notification from '../models/Notification.js';

/**
 * Pomocnicza funkcja obliczajaca srednia
 */
function avg(arr) {
  if (!arr.length) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

/**
 * Generuje strzalke trendu
 */
function trendArrow(current, previous) {
  if (current == null || previous == null) return '';
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return '&#8594;'; // →
  return diff > 0 ? '&#8593;' : '&#8595;'; // ↑ ↓
}

/**
 * Generuje kolor trendu
 */
function trendColor(current, previous, higherIsBetter = true) {
  if (current == null || previous == null) return '#8B92A5';
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return '#F59E0B';
  const isPositive = higherIsBetter ? diff > 0 : diff < 0;
  return isPositive ? '#22C55E' : '#EF4444';
}

/**
 * Generuje rekomendacje na podstawie danych
 */
function generateRecommendation(recoveryAvg, sleepAvg, hrAvg, strainAvg) {
  const tips = [];

  if (recoveryAvg != null) {
    if (recoveryAvg >= 70) {
      tips.push('Regeneracja na dobrym poziomie - mozna utrzymac intensywnosc treningow.');
    } else if (recoveryAvg >= 50) {
      tips.push('Regeneracja umiarkowana - warto wlaczac dni odpoczynku miedzy intensywnymi treningami.');
    } else {
      tips.push('Niska regeneracja - zalecany odpoczynek lub lzejsze treningi w tym tygodniu.');
    }
  }

  if (sleepAvg != null) {
    const sleepHours = sleepAvg / 60;
    if (sleepHours < 7) {
      tips.push('Sredni czas snu ponizej 7h - poprawa snu moze znaczaco wplynac na wyniki.');
    } else if (sleepHours >= 8) {
      tips.push('Swietna ilosc snu! To kluczowe dla regeneracji mlodego sportowca.');
    }
  }

  if (strainAvg != null && strainAvg > 14) {
    tips.push('Wysokie obciazenie treningowe - upewnij sie, ze regeneracja nadaza za wysilkiem.');
  }

  return tips.length
    ? tips.join(' ')
    : 'Kontynuuj obecny plan treningowy i monitoruj dane zdrowotne.';
}

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
    // Dynamiczny import emailService (unikamy cyklicznych zaleznosci)
    const { default: sendEmail } = await import('./emailService.js').then(m => {
      // emailService eksportuje poszczegolne funkcje, musimy importowac sendEmail
      // Ale w aktualnej wersji nie eksportuje sendEmail bezposrednio
      // Uzyjemy import calego modulu
      return m;
    }).catch(() => ({ default: null }));

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
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);

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

        // Dane z biezacego tygodnia
        const currentData = await WearableData.find({
          player: child._id,
          type: 'daily_summary',
          date: { $gte: weekStart, $lt: weekEnd },
        });

        // Dane z poprzedniego tygodnia
        const previousData = await WearableData.find({
          player: child._id,
          type: 'daily_summary',
          date: { $gte: prevWeekStart, $lt: weekStart },
        });

        // Oblicz srednie
        const curRecovery = avg(currentData.filter(d => d.metrics?.recovery?.score).map(d => d.metrics.recovery.score));
        const prevRecovery = avg(previousData.filter(d => d.metrics?.recovery?.score).map(d => d.metrics.recovery.score));

        const curSleep = avg(currentData.filter(d => d.metrics?.sleep?.totalMinutes).map(d => d.metrics.sleep.totalMinutes));
        const prevSleep = avg(previousData.filter(d => d.metrics?.sleep?.totalMinutes).map(d => d.metrics.sleep.totalMinutes));

        const curHR = avg(currentData.filter(d => d.metrics?.heartRate?.resting).map(d => d.metrics.heartRate.resting));
        const prevHR = avg(previousData.filter(d => d.metrics?.heartRate?.resting).map(d => d.metrics.heartRate.resting));

        const curStrain = avg(currentData.filter(d => d.metrics?.strain?.value).map(d => d.metrics.strain.value));
        const prevStrain = avg(previousData.filter(d => d.metrics?.strain?.value).map(d => d.metrics.strain.value));

        // Treningi w tym tygodniu
        const sessions = await Session.find({
          player: child._id,
          date: { $gte: weekStart, $lt: weekEnd },
        });
        const sessionCount = sessions.length;
        const totalStrain = curStrain != null ? Math.round(curStrain * currentData.length * 10) / 10 : null;

        const recommendation = generateRecommendation(curRecovery, curSleep, curHR, curStrain);

        const sleepHours = curSleep != null ? `${Math.floor(curSleep / 60)}h ${Math.round(curSleep % 60)}min` : 'Brak danych';
        const prevSleepHours = prevSleep != null ? `${Math.floor(prevSleep / 60)}h ${Math.round(prevSleep % 60)}min` : '-';

        childrenHtml += `
          <div style="background: #1A1F2E; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h3 style="color: #CCFF00; margin: 0 0 16px 0; font-size: 18px;">${childName}</h3>
            <p style="color: #8B92A5; margin: 0 0 16px 0; font-size: 13px;">
              ${formatDate(weekStart)} - ${formatDate(weekEnd)}
            </p>

            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Regeneracja</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${curRecovery != null ? `${curRecovery}%` : 'Brak danych'}
                  <span style="color: ${trendColor(curRecovery, prevRecovery)}; margin-left: 6px;">${trendArrow(curRecovery, prevRecovery)}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Sen (srednia)</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${sleepHours}
                  <span style="color: ${trendColor(curSleep, prevSleep)}; margin-left: 6px;">${trendArrow(curSleep, prevSleep)}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Tetno spoczynkowe</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${curHR != null ? `${curHR} bpm` : 'Brak danych'}
                  <span style="color: ${trendColor(curHR, prevHR, false)}; margin-left: 6px;">${trendArrow(curHR, prevHR)}</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Treningi</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${sessionCount} sesji
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px;">Obciazenie (strain)</td>
                <td style="padding: 10px 0; color: #F0F2F5; font-size: 14px; text-align: right;">
                  ${curStrain != null ? curStrain : 'Brak danych'}
                  <span style="color: ${trendColor(curStrain, prevStrain)}; margin-left: 6px;">${trendArrow(curStrain, prevStrain)}</span>
                </td>
              </tr>
            </table>

            <div style="background: rgba(204,255,0,0.08); border-left: 3px solid #CCFF00; padding: 12px 16px; margin-top: 16px; border-radius: 0 8px 8px 0;">
              <p style="color: #F0F2F5; font-size: 13px; margin: 0;">
                <strong style="color: #CCFF00;">Rekomendacja:</strong> ${recommendation}
              </p>
            </div>
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
        // Reimportujemy sendEmail w prosty sposob — uzywamy wzorca z emailService
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

      // Utworz powiadomienie weekly_summary
      await Notification.create({
        user: parent._id,
        type: 'weekly_summary',
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
