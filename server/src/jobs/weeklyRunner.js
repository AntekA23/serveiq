import { sendWeeklySummaries } from '../services/weeklyEmailService.js';

/**
 * Runner tygodniowego podsumowania.
 * Sprawdza czy jest poniedzialek o 7:00 rano — jesli tak, wysyla podsumowania.
 * Uruchamiane co godzine przez startJobs().
 */
export async function runWeeklySummary() {
  const now = new Date();

  // Tylko poniedzialek (1) o godzinie 7:00
  if (now.getDay() !== 1 || now.getHours() !== 7) return;

  console.log('[WeeklyRunner] Poniedzialek 7:00 — uruchamiam tygodniowe podsumowania...');

  try {
    await sendWeeklySummaries();
  } catch (error) {
    console.error('[WeeklyRunner] Blad:', error.message);
  }
}
