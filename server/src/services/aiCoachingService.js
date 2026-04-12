import Anthropic from '@anthropic-ai/sdk';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import WearableData from '../models/WearableData.js';
import Tournament from '../models/Tournament.js';

// ====== Claude API klient ======

let client = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY nie ustawiony');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

// ====== Pomocnicze ======

async function getPlayerContext(playerId, days = 30) {
  const player = await Player.findById(playerId);
  if (!player) throw new Error('Zawodnik nie znaleziony');

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [sessions, wearableData, tournaments] = await Promise.all([
    Session.find({ player: playerId, date: { $gte: since } }).sort({ date: -1 }),
    WearableData.find({
      player: playerId,
      date: { $gte: since },
      type: 'daily_summary',
    }).sort({ date: -1 }).limit(days),
    Tournament.find({
      player: playerId,
      $or: [
        { startDate: { $gte: since } },
        { endDate: { $gte: since } },
      ],
    }),
  ]);

  // Build session summary
  const sessionSummary = sessions.map((s) => ({
    date: s.date.toISOString().split('T')[0],
    type: s.sessionType,
    duration: s.durationMinutes,
    title: s.title,
    focusAreas: s.focusAreas || [],
  }));

  // Build wearable summary
  const wearableSummary = wearableData.slice(0, 7).map((w) => ({
    date: w.date.toISOString().split('T')[0],
    recovery: w.metrics?.recovery?.score,
    hrv: w.metrics?.hrv?.value,
    restingHR: w.metrics?.heartRate?.resting,
    sleepQuality: w.metrics?.sleep?.quality,
    strain: w.metrics?.strain?.value,
  }));

  // Build tournament summary
  const tournamentSummary = tournaments.map((t) => ({
    name: t.name,
    dates: `${t.startDate?.toISOString().split('T')[0]} — ${t.endDate?.toISOString().split('T')[0]}`,
    category: t.category,
    result: t.result ? `${t.result.round || ''} (W:${t.result.wins || 0} L:${t.result.losses || 0})` : 'Zaplanowany',
  }));

  // Goals
  const goals = (player.goals || []).map((g) => ({
    text: g.text,
    completed: g.completed,
    dueDate: g.dueDate?.toISOString().split('T')[0],
  }));

  // Age
  const age = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return {
    player: {
      name: `${player.firstName} ${player.lastName}`,
      age,
      gender: player.gender,
      ranking: player.ranking,
    },
    sessions: sessionSummary,
    wearable: wearableSummary,
    tournaments: tournamentSummary,
    goals,
  };
}

// ====== Publiczne API ======

/**
 * Generuje rekomendacje treningowe na podstawie danych zawodnika
 */
export async function generateRecommendations(playerId) {
  const ctx = await getPlayerContext(playerId, 14);

  const prompt = `Jesteś asystentem trenera tenisa. Analizujesz dane zawodnika i generujesz konkretne, praktyczne rekomendacje treningowe.

DANE ZAWODNIKA:
- Imię: ${ctx.player.name}
- Wiek: ${ctx.player.age || 'nieznany'} lat
- Płeć: ${ctx.player.gender === 'M' ? 'chłopiec' : ctx.player.gender === 'F' ? 'dziewczyna' : 'nieznana'}
${ctx.player.ranking?.pzt ? `- Ranking PZT: #${ctx.player.ranking.pzt}` : ''}

OSTATNIE SESJE (14 dni):
${ctx.sessions.length > 0 ? ctx.sessions.map((s) => `- ${s.date}: ${s.type} (${s.duration}min) "${s.title}"`).join('\n') : 'Brak sesji'}

DANE ZDROWOTNE (ostatnie 7 dni):
${ctx.wearable.length > 0 ? ctx.wearable.map((w) => `- ${w.date}: recovery=${w.recovery || '?'}%, HRV=${w.hrv || '?'}ms, HR=${w.restingHR || '?'}bpm, sen=${w.sleepQuality || '?'}%`).join('\n') : 'Brak danych'}

TURNIEJE:
${ctx.tournaments.length > 0 ? ctx.tournaments.map((t) => `- ${t.name} (${t.dates}) — ${t.result}`).join('\n') : 'Brak'}

CELE:
${ctx.goals.filter((g) => !g.completed).map((g) => `- ${g.text}${g.dueDate ? ` (termin: ${g.dueDate})` : ''}`).join('\n') || 'Brak'}

Na podstawie tych danych wygeneruj DOKŁADNIE 4 konkretne rekomendacje na następny tydzień.
Odpowiedz w formacie JSON (bez markdown):
{
  "recommendations": [
    {
      "title": "krótki tytuł (max 50 znaków)",
      "description": "konkretny opis co robić i dlaczego (2-3 zdania)",
      "priority": "high" | "medium" | "low",
      "category": "technique" | "fitness" | "mental" | "recovery" | "tactical"
    }
  ],
  "weekSummary": "1-2 zdania podsumowania tygodnia i ogólnego stanu zawodnika"
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0]?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { recommendations: [], weekSummary: text };
  }
}

/**
 * Generuje szkic oceny okresowej na podstawie danych
 */
export async function generateReviewDraft(playerId, periodStart, periodEnd) {
  const days = Math.ceil((new Date(periodEnd) - new Date(periodStart)) / (24 * 3600 * 1000));
  const ctx = await getPlayerContext(playerId, days);

  const prompt = `Jesteś doświadczonym trenerem tenisa. Piszesz okresową ocenę zawodnika dla rodziców.

DANE ZAWODNIKA:
- Imię: ${ctx.player.name}, wiek: ${ctx.player.age || '?'} lat
- Okres oceny: ${new Date(periodStart).toLocaleDateString('pl-PL')} — ${new Date(periodEnd).toLocaleDateString('pl-PL')}

SESJE W OKRESIE (${ctx.sessions.length} sesji):
${ctx.sessions.slice(0, 15).map((s) => `- ${s.date}: ${s.type} (${s.duration}min) "${s.title}"`).join('\n') || 'Brak'}

TURNIEJE:
${ctx.tournaments.map((t) => `- ${t.name}: ${t.result}`).join('\n') || 'Brak'}

CELE:
${ctx.goals.map((g) => `- ${g.text} (${g.completed ? 'ukończony' : 'w trakcie'})`).join('\n') || 'Brak'}

Napisz ocenę w formacie JSON (bez markdown). Pisz po polsku, profesjonalnie ale ciepło:
{
  "title": "Tytuł oceny (np. 'Ocena miesięczna — marzec 2026')",
  "strengths": "2-4 zdania o mocnych stronach i postępach (konkretne przykłady z sesji)",
  "areasToImprove": "2-3 zdania o obszarach do poprawy (konstruktywnie)",
  "recommendations": "2-3 konkretne zalecenia na następny okres",
  "overallRating": <liczba 1-5>,
  "notes": "1-2 zdania dodatkowych uwag lub motywacji dla rodzica"
}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0]?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { title: '', strengths: text, areasToImprove: '', recommendations: '', overallRating: 3 };
  }
}
