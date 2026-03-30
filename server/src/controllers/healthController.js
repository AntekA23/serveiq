import WearableData from '../models/WearableData.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Tournament from '../models/Tournament.js';

// ====== Helpers ======

async function verifyParentAccess(parentId, playerId) {
  const player = await Player.findOne({
    _id: playerId,
    parents: parentId,
    active: true,
  });
  return player;
}

function calcStats(values) {
  if (!values.length) return { min: 0, avg: 0, max: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  return { min, avg, max };
}

function deltaPercent(current, previous) {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// ====== Kontrolery ======

/**
 * GET /api/wearables/data/:playerId/trends?range=7|30|90
 * Oblicza min/max/avg dla kazdej metryki w podanym okresie
 * oraz ten sam zakres dla POPRZEDNIEGO okresu tej samej dlugosci
 */
export const getTrends = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const range = parseInt(req.query.range) || 7;

    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({ message: 'Brak dostepu do danych tego zawodnika' });
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const currentFrom = new Date(now);
    currentFrom.setDate(currentFrom.getDate() - range);
    currentFrom.setHours(0, 0, 0, 0);

    const prevFrom = new Date(currentFrom);
    prevFrom.setDate(prevFrom.getDate() - range);

    // Pobierz dane biezacego okresu
    const currentData = await WearableData.find({
      player: playerId,
      type: 'daily_summary',
      date: { $gte: currentFrom, $lte: now },
    }).sort({ date: 1 });

    // Pobierz dane poprzedniego okresu
    const prevData = await WearableData.find({
      player: playerId,
      type: 'daily_summary',
      date: { $gte: prevFrom, $lt: currentFrom },
    }).sort({ date: 1 });

    function extractMetrics(records) {
      const hr = [], hrv = [], sleep = [], recovery = [], strain = [];
      const sleepDetail = [];

      records.forEach((r) => {
        const m = r.metrics || {};
        if (m.heartRate?.resting) hr.push(m.heartRate.resting);
        if (m.hrv?.value) hrv.push(m.hrv.value);
        if (m.sleep?.quality) sleep.push(m.sleep.quality);
        if (m.recovery?.score) recovery.push(m.recovery.score);
        if (m.strain?.value) strain.push(m.strain.value);

        sleepDetail.push({
          date: r.date,
          deep: m.sleep?.deepMinutes || 0,
          rem: m.sleep?.remMinutes || 0,
          light: Math.max(0, (m.sleep?.totalMinutes || 0) - (m.sleep?.deepMinutes || 0) - (m.sleep?.remMinutes || 0) - (m.sleep?.awakeMinutes || 0)),
          awake: m.sleep?.awakeMinutes || 0,
        });
      });

      return { hr, hrv, sleep, recovery, strain, sleepDetail };
    }

    const current = extractMetrics(currentData);
    const prev = extractMetrics(prevData);

    const chartData = currentData.map((r) => ({
      date: r.date,
      hr: r.metrics?.heartRate?.resting || null,
      hrv: r.metrics?.hrv?.value || null,
      sleep: r.metrics?.sleep?.quality || null,
      recovery: r.metrics?.recovery?.score || null,
      strain: r.metrics?.strain?.value || null,
    }));

    res.json({
      range,
      chartData,
      sleepDetail: current.sleepDetail,
      metrics: {
        hr: {
          current: calcStats(current.hr),
          previous: calcStats(prev.hr),
          delta: deltaPercent(calcStats(current.hr).avg, calcStats(prev.hr).avg),
        },
        hrv: {
          current: calcStats(current.hrv),
          previous: calcStats(prev.hrv),
          delta: deltaPercent(calcStats(current.hrv).avg, calcStats(prev.hrv).avg),
        },
        sleep: {
          current: calcStats(current.sleep),
          previous: calcStats(prev.sleep),
          delta: deltaPercent(calcStats(current.sleep).avg, calcStats(prev.sleep).avg),
        },
        recovery: {
          current: calcStats(current.recovery),
          previous: calcStats(prev.recovery),
          delta: deltaPercent(calcStats(current.recovery).avg, calcStats(prev.recovery).avg),
        },
        strain: {
          current: calcStats(current.strain),
          previous: calcStats(prev.strain),
          delta: deltaPercent(calcStats(current.strain).avg, calcStats(prev.strain).avg),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/players/:id/timeline?limit=50
 * Agreguje wydarzenia z sesji, celow, turniejow i trendow zdrowotnych
 */
export const getTimeline = async (req, res, next) => {
  try {
    const { id: playerId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({ message: 'Brak dostepu do tego zawodnika' });
    }

    const events = [];

    // 1. Sesje z aktualizacjami umiejetnosci
    const sessions = await Session.find({
      player: playerId,
      visibleToParent: true,
    })
      .sort({ date: -1 })
      .limit(30);

    const typeLabels = {
      kort: 'Kort', sparing: 'Sparing', kondycja: 'Kondycja',
      rozciaganie: 'Rozciaganie', mecz: 'Mecz', inne: 'Trening',
    };

    sessions.forEach((s) => {
      // Add session as training event
      events.push({
        type: 'session',
        date: s.date,
        title: s.title || typeLabels[s.sessionType] || 'Trening',
        description: [
          typeLabels[s.sessionType],
          s.durationMinutes ? `${s.durationMinutes}min` : null,
          s.notes,
        ].filter(Boolean).join(' · '),
        sessionType: s.sessionType,
      });

      // Also add skill updates if present
      if (s.skillUpdates && s.skillUpdates.length > 0) {
        s.skillUpdates.forEach((su) => {
          events.push({
            type: 'skill_update',
            date: s.date,
            title: `${su.skill}: ${su.scoreBefore}% -> ${su.scoreAfter}%`,
            description: s.title,
          });
        });
      }
    });

    // 2. Cele ukonczone
    if (player.goals) {
      player.goals
        .filter((g) => g.completed && g.completedAt)
        .forEach((g) => {
          events.push({
            type: 'goal_completed',
            date: g.completedAt,
            title: 'Cel osiagniety',
            description: g.text,
          });
        });
    }

    // 3. Turnieje
    const tournaments = await Tournament.find({ player: playerId })
      .sort({ startDate: -1 })
      .limit(10);

    tournaments.forEach((t) => {
      const result = t.result ? ` - ${t.result.round}` : '';
      events.push({
        type: 'tournament',
        date: t.startDate,
        title: `${t.name}${result}`,
        description: t.location || '',
      });
    });

    // 4. Trendy zdrowotne (HRV zmiany > 10% tydzien do tygodnia)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentHealth = await WearableData.find({
      player: playerId,
      type: 'daily_summary',
      date: { $gte: twoWeeksAgo },
    }).sort({ date: 1 });

    const thisWeek = recentHealth.filter((d) => d.date >= weekAgo);
    const lastWeek = recentHealth.filter((d) => d.date < weekAgo);

    if (thisWeek.length > 0 && lastWeek.length > 0) {
      const avgThisWeek =
        thisWeek.reduce((s, d) => s + (d.metrics?.hrv?.value || 0), 0) / thisWeek.length;
      const avgLastWeek =
        lastWeek.reduce((s, d) => s + (d.metrics?.hrv?.value || 0), 0) / lastWeek.length;
      const change = ((avgThisWeek - avgLastWeek) / avgLastWeek) * 100;

      if (Math.abs(change) > 10) {
        events.push({
          type: 'health_trend',
          date: new Date(),
          title: `HRV ${change > 0 ? 'wzroslo' : 'spadlo'} o ${Math.abs(Math.round(change))}%`,
          description: `Srednie HRV: ${Math.round(avgThisWeek)} ms (vs ${Math.round(avgLastWeek)} ms tydzien wczesniej)`,
        });
      }
    }

    // Sortuj po dacie malejaco i ogranicz
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ events: events.slice(0, limit) });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/wearables/data/:playerId/compare?p1_from=&p1_to=&p2_from=&p2_to=
 * Porownuje srednie metryk miedzy dwoma okresami
 */
export const comparePeriods = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { p1_from, p1_to, p2_from, p2_to } = req.query;

    if (!p1_from || !p1_to || !p2_from || !p2_to) {
      return res.status(400).json({ message: 'Wymagane parametry: p1_from, p1_to, p2_from, p2_to' });
    }

    const player = await verifyParentAccess(req.user._id, playerId);
    if (!player) {
      return res.status(403).json({ message: 'Brak dostepu do danych tego zawodnika' });
    }

    async function getPeriodAvgs(from, to) {
      const data = await WearableData.find({
        player: playerId,
        type: 'daily_summary',
        date: { $gte: new Date(from), $lte: new Date(to) },
      });

      const vals = { hr: [], hrv: [], sleep: [], recovery: [], strain: [] };
      data.forEach((r) => {
        const m = r.metrics || {};
        if (m.heartRate?.resting) vals.hr.push(m.heartRate.resting);
        if (m.hrv?.value) vals.hrv.push(m.hrv.value);
        if (m.sleep?.quality) vals.sleep.push(m.sleep.quality);
        if (m.recovery?.score) vals.recovery.push(m.recovery.score);
        if (m.strain?.value) vals.strain.push(m.strain.value);
      });

      return {
        hr: calcStats(vals.hr),
        hrv: calcStats(vals.hrv),
        sleep: calcStats(vals.sleep),
        recovery: calcStats(vals.recovery),
        strain: calcStats(vals.strain),
        days: data.length,
      };
    }

    const period1 = await getPeriodAvgs(p1_from, p1_to);
    const period2 = await getPeriodAvgs(p2_from, p2_to);

    res.json({
      period1: { from: p1_from, to: p1_to, ...period1 },
      period2: { from: p2_from, to: p2_to, ...period2 },
      deltas: {
        hr: deltaPercent(period1.hr.avg, period2.hr.avg),
        hrv: deltaPercent(period1.hrv.avg, period2.hrv.avg),
        sleep: deltaPercent(period1.sleep.avg, period2.sleep.avg),
        recovery: deltaPercent(period1.recovery.avg, period2.recovery.avg),
        strain: deltaPercent(period1.strain.avg, period2.strain.avg),
      },
    });
  } catch (error) {
    next(error);
  }
};
