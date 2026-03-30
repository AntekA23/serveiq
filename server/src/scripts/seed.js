import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';
import Message from '../models/Message.js';
import Review from '../models/Review.js';

/**
 * Seed script - wypełnia bazę danych przykładowymi danymi
 *
 * Użycie: npm run seed
 */

const randomSkillScore = () => Math.floor(Math.random() * 51) + 30; // 30-80

const seed = async () => {
  try {
    console.log('🎾 ServeIQ - Seed Script');
    console.log('========================\n');

    // Połącz z MongoDB
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/serveiq';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Połączono z bazą danych\n');

    // Wyczyść wszystkie kolekcje
    console.log('Czyszczenie kolekcji...');
    await Promise.all([
      User.deleteMany({}),
      Player.deleteMany({}),
      Session.deleteMany({}),
      Payment.deleteMany({}),
      Tournament.deleteMany({}),
      Message.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('Kolekcje wyczyszczone.\n');

    // ====== Tworzenie użytkowników ======

    console.log('Tworzenie użytkowników...');

    const coach = await User.create({
      email: 'coach@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Tomasz',
      lastName: 'Trenerski',
      phone: '+48 600 100 200',
      isActive: true,
      coachProfile: {
        club: 'KT Smecz Warszawa',
        itfLevel: 'ITF Level 2',
        bio: 'Trener tenisa z 15-letnim doświadczeniem. Specjalizacja: praca z młodzieżą.',
      },
    });

    const parent = await User.create({
      email: 'parent@serveiq.pl',
      password: 'password123',
      role: 'parent',
      firstName: 'Anna',
      lastName: 'Nowak',
      phone: '+48 601 200 300',
      isActive: true,
      onboardingCompleted: true,
    });

    console.log(`  Trener: ${coach.email} (hasło: password123)`);
    console.log(`  Rodzic: ${parent.email} (hasło: password123)\n`);

    // ====== Tworzenie zawodników ======

    console.log('Tworzenie zawodników...');

    const playersData = [
      {
        firstName: 'Kacper',
        lastName: 'Nowak',
        dateOfBirth: new Date('2012-03-15'),
        gender: 'M',
        monthlyRate: 800,
        ranking: { pzt: 45 },
      },
      {
        firstName: 'Julia',
        lastName: 'Kowalska',
        dateOfBirth: new Date('2011-07-22'),
        gender: 'F',
        monthlyRate: 800,
        ranking: { pzt: 28 },
      },
      {
        firstName: 'Antoni',
        lastName: 'Wiśniewski',
        dateOfBirth: new Date('2013-01-10'),
        gender: 'M',
        monthlyRate: 600,
        ranking: { pzt: 72 },
      },
    ];

    const players = [];
    for (const pData of playersData) {
      const player = await Player.create({
        ...pData,
        coach: coach._id,
        skills: {
          serve: { score: randomSkillScore(), notes: '' },
          forehand: { score: randomSkillScore(), notes: '' },
          backhand: { score: randomSkillScore(), notes: '' },
          volley: { score: randomSkillScore(), notes: '' },
          tactics: { score: randomSkillScore(), notes: '' },
          fitness: { score: randomSkillScore(), notes: '' },
        },
        goals: [
          { text: 'Poprawa drugiego serwisu', dueDate: new Date('2026-06-01') },
          { text: 'Przygotowanie do turnieju regionalnego', dueDate: new Date('2026-05-15') },
        ],
      });
      players.push(player);
      console.log(`  ${player.firstName} ${player.lastName}`);
    }

    // Połącz rodzica z Kacprem
    const kacper = players[0];
    kacper.parents.push(parent._id);

    // Dodaj plan treningowy z harmonogramem tygodniowym
    kacper.trainingPlan = {
      weeklySchedule: [
        { day: 1, sessionType: 'kort', durationMinutes: 90, startTime: '16:00', notes: 'Praca nad serwisem' },
        { day: 1, sessionType: 'kondycja', durationMinutes: 45, startTime: '18:00', notes: '' },
        { day: 2, sessionType: 'rozciaganie', durationMinutes: 30, startTime: '07:00', notes: 'Poranne rozciaganie' },
        { day: 3, sessionType: 'kort', durationMinutes: 90, startTime: '16:00', notes: 'Gra z bazy' },
        { day: 3, sessionType: 'kondycja', durationMinutes: 45, startTime: '18:00', notes: '' },
        { day: 5, sessionType: 'sparing', durationMinutes: 120, startTime: '15:00', notes: 'Sparing z Julka' },
        { day: 6, sessionType: 'kort', durationMinutes: 60, startTime: '10:00', notes: 'Trening techniczny' },
      ],
      scheduledDays: [1, 2, 3, 5, 6],
      weeklyGoal: { sessionsPerWeek: 7, hoursPerWeek: 8 },
      focus: ['Serwis', 'Forhend', 'Kondycja'],
      notes: 'Kacper przygotowuje sie do turnieju w maju. Fokus na serwis i gre z bazy.',
      milestones: [
        { text: 'Serwis plaski > 100 km/h', date: new Date('2026-05-01') },
        { text: 'Turniej regionalny - cwiecfinal', date: new Date('2026-05-15') },
        { text: 'Poprawa footworku na backhandzie', completed: true, completedAt: new Date('2026-03-20') },
      ],
    };
    await kacper.save();

    parent.parentProfile = { children: [kacper._id] };
    await parent.save();

    console.log(`\n  Rodzic Anna Nowak powiązany z zawodnikiem Kacper Nowak`);
    console.log(`  Plan treningowy z harmonogramem tygodniowym dodany dla Kacpra\n`);

    // ====== Tworzenie sesji treningowych ======

    console.log('Tworzenie sesji treningowych...');

    const now = new Date();
    const sessionsData = [
      {
        player: kacper._id,
        title: 'Trening serwisu',
        sessionType: 'kort',
        surface: 'clay',
        startTime: '16:00',
        daysAgo: 2,
        durationMinutes: 90,
        notes: 'Praca nad płaskim serwisem. Kacper robi postępy w tossie.',
        focusAreas: ['serwis', 'toss'],
      },
      {
        player: kacper._id,
        title: 'Gra z bazy',
        sessionType: 'kort',
        surface: 'clay',
        startTime: '16:00',
        daysAgo: 21,
        durationMinutes: 60,
        notes: 'Ćwiczenie forehandu cross-court. Trzeba popracować nad footworkiem.',
        focusAreas: ['forehand', 'footwork'],
        skillUpdates: [
          { skill: 'forehand', scoreBefore: 38, scoreAfter: 42 },
          { skill: 'fitness', scoreBefore: 35, scoreAfter: 37 },
        ],
      },
      {
        player: kacper._id,
        title: 'Serwis i return',
        sessionType: 'kort',
        surface: 'clay',
        startTime: '16:00',
        daysAgo: 14,
        durationMinutes: 75,
        notes: 'Praca nad pierwszym serwisem — plaska pilka. Return z bekhendu.',
        focusAreas: ['serwis', 'return'],
        skillUpdates: [
          { skill: 'serve', scoreBefore: 40, scoreAfter: 45 },
          { skill: 'backhand', scoreBefore: 32, scoreAfter: 35 },
        ],
      },
      {
        player: kacper._id,
        title: 'Gra z bazy + wolej',
        sessionType: 'kort',
        surface: 'clay',
        startTime: '16:00',
        daysAgo: 7,
        durationMinutes: 90,
        notes: 'Podejscia do siatki z forhandu. Dobre wyczucie woleja.',
        focusAreas: ['forehand', 'volley'],
        skillUpdates: [
          { skill: 'forehand', scoreBefore: 42, scoreAfter: 46 },
          { skill: 'volley', scoreBefore: 30, scoreAfter: 34 },
        ],
      },
      {
        player: kacper._id,
        title: 'Trening kondycyjny',
        sessionType: 'kondycja',
        startTime: '18:00',
        daysAgo: 5,
        durationMinutes: 45,
        notes: 'Szybkość i koordynacja. Drabinka, skakanki, sprint.',
        focusAreas: ['fitness', 'szybkosc'],
        skillUpdates: [
          { skill: 'fitness', scoreBefore: 37, scoreAfter: 42 },
        ],
      },
      {
        player: kacper._id,
        title: 'Taktyka meczowa',
        sessionType: 'sparing',
        surface: 'clay',
        startTime: '15:00',
        daysAgo: 2,
        durationMinutes: 90,
        notes: 'Sparing z Antonim. Kacper lepiej czyta gre rywala.',
        focusAreas: ['taktyka', 'gra meczowa'],
        skillUpdates: [
          { skill: 'tactics', scoreBefore: 33, scoreAfter: 38 },
          { skill: 'serve', scoreBefore: 45, scoreAfter: 48 },
        ],
      },
      {
        player: players[1]._id,
        title: 'Trening na siatce',
        sessionType: 'kort',
        surface: 'hard',
        startTime: '14:00',
        daysAgo: 3,
        durationMinutes: 90,
        notes: 'Julia świetnie radzi sobie z wolej forehandowy. Backhand volley wymaga korekty.',
        focusAreas: ['wolej', 'siatka'],
        skillUpdates: [
          { skill: 'volley', scoreBefore: 50, scoreAfter: 55 },
        ],
      },
      {
        player: players[1]._id,
        title: 'Przygotowanie turniejowe',
        sessionType: 'sparing',
        surface: 'clay',
        startTime: '15:00',
        daysAgo: 7,
        durationMinutes: 120,
        notes: 'Symulacja meczowa. Julia powinna grać bardziej agresywnie na returnach.',
        focusAreas: ['taktyka', 'return'],
        skillUpdates: [
          { skill: 'tactics', scoreBefore: 45, scoreAfter: 49 },
          { skill: 'forehand', scoreBefore: 55, scoreAfter: 58 },
        ],
      },
      {
        player: players[2]._id,
        title: 'Trening ogólnorozwojowy',
        sessionType: 'kondycja',
        startTime: '09:00',
        daysAgo: 1,
        durationMinutes: 60,
        notes: 'Praca nad koordynacją i szybkością. Antoni robi duże postępy w fitness.',
        focusAreas: ['fitness', 'koordynacja'],
        skillUpdates: [
          { skill: 'fitness', scoreBefore: 40, scoreAfter: 45 },
        ],
      },
    ];

    for (const sData of sessionsData) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - sData.daysAgo);

      await Session.create({
        player: sData.player,
        coach: coach._id,
        createdBy: coach._id,
        source: 'coach',
        date: sessionDate,
        sessionType: sData.sessionType || 'kort',
        surface: sData.surface || '',
        startTime: sData.startTime || '',
        durationMinutes: sData.durationMinutes,
        title: sData.title,
        notes: sData.notes,
        focusAreas: sData.focusAreas,
        skillUpdates: sData.skillUpdates || [],
        visibleToParent: true,
      });
      console.log(`  ${sData.title} (${sData.daysAgo} dni temu)`);
    }
    console.log('');

    // ====== Tworzenie płatności ======

    console.log('Tworzenie płatności...');

    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const paidPayment = await Payment.create({
      player: kacper._id,
      coach: coach._id,
      parent: parent._id,
      amount: 800,
      currency: 'PLN',
      description: 'Treningi tenisowe - luty 2026',
      dueDate: lastMonth,
      status: 'paid',
      paidAt: new Date(lastMonth.getTime() + 3 * 24 * 60 * 60 * 1000),
    });
    console.log(`  Opłacona: ${paidPayment.amount} PLN - ${paidPayment.description}`);

    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(10);

    const pendingPayment = await Payment.create({
      player: kacper._id,
      coach: coach._id,
      parent: parent._id,
      amount: 800,
      currency: 'PLN',
      description: 'Treningi tenisowe - marzec 2026',
      dueDate: nextMonth,
      status: 'pending',
    });
    console.log(`  Oczekująca: ${pendingPayment.amount} PLN - ${pendingPayment.description}\n`);

    // ====== Tworzenie turnieju ======

    console.log('Tworzenie turniejów...');

    const tournament = await Tournament.create({
      player: players[1]._id,
      coach: coach._id,
      createdBy: coach._id,
      source: 'coach',
      name: 'Ogólnopolski Turniej Młodzieżowy - Kraków',
      location: 'Kraków, KS Olsza',
      surface: 'clay',
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-04-18'),
      category: 'U14',
      drawSize: 32,
      result: {
        round: 'Ćwierćfinał',
        wins: 2,
        losses: 1,
      },
      notes: 'Julia doszła do ćwierćfinału. Przegrała z 3. rozstawioną zawodniczką.',
    });
    console.log(`  ${tournament.name}`);

    const tournament2 = await Tournament.create({
      player: kacper._id,
      coach: coach._id,
      createdBy: parent._id,
      source: 'parent',
      name: 'Turniej Tennis 10 — Warszawa',
      location: 'Warszawa, KT Smecz',
      surface: 'clay',
      startDate: new Date('2026-04-25'),
      endDate: new Date('2026-04-26'),
      category: 'Tennis 10 Red',
      drawSize: 16,
      status: 'planned',
      notes: 'Pierwszy turniej Kacpra w tym sezonie.',
    });
    console.log(`  ${tournament2.name}\n`);

    // ====== Tworzenie wiadomosci ======

    console.log('Tworzenie wiadomosci...');

    const messagesData = [
      { from: coach._id, to: parent._id, text: 'Witam! Kacper robi swietne postepy na treningach.', daysAgo: 3 },
      { from: parent._id, to: coach._id, text: 'Dziekuje! Bardzo sie cieszy z treningow.', daysAgo: 3 },
      { from: coach._id, to: parent._id, text: 'W przyszlym tygodniu chcialbym skupic sie na serwisie. Prosze o dodatkowe rozciaganie w domu.', daysAgo: 2 },
      { from: parent._id, to: coach._id, text: 'Jasne, zadbam o to. Czy jest cos co moglibysmy cwiczye na podworku?', daysAgo: 1 },
      { from: coach._id, to: parent._id, text: 'Tak - proste cwiczenia z pilka o sciane, forehand i backhand po 50 uderzen dziennie.', daysAgo: 1 },
    ];

    for (const mData of messagesData) {
      const msgDate = new Date(now);
      msgDate.setDate(msgDate.getDate() - mData.daysAgo);
      msgDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      await Message.create({
        from: mData.from,
        to: mData.to,
        text: mData.text,
        read: true,
        createdAt: msgDate,
        updatedAt: msgDate,
      });
    }
    console.log(`  ${messagesData.length} wiadomosci miedzy trenerem a rodzicem\n`);

    // ====== Tworzenie ocen ======

    console.log('Tworzenie ocen...');

    const review1 = await Review.create({
      player: kacper._id,
      coach: coach._id,
      periodStart: new Date('2026-02-01'),
      periodEnd: new Date('2026-02-28'),
      type: 'monthly',
      title: 'Ocena miesieczna — luty 2026',
      strengths: 'Kacper robi swietne postepy w forhendzie. Uderzenie jest coraz bardziej stabilne, a rotacja pilki znacznie sie poprawila. Bardzo dobra postawa na korcie i zaangazowanie na treningach.',
      areasToImprove: 'Drugi serwis wymaga wiecej pracy — za duzo podwojnych bledow w meczach treningowych. Bekhend jednoreczny jest slabszy przy pilkach nizszych.',
      recommendations: 'Proponuje dodatkowe cwiczenia serwisowe 2x w tygodniu po 20 minut. Warto tez popracowac nad footworkiem przy bekhendie — cwiczenia z drabinka koordynacyjna.',
      notes: 'Kacper jest bardzo zmotywowany i chetnie pracuje na treningach. Widze duzy potencjal na nadchodzacy sezon turniejowy.',
      skillRatings: {
        serve: kacper.skills.serve.score,
        forehand: kacper.skills.forehand.score,
        backhand: kacper.skills.backhand.score,
        volley: kacper.skills.volley.score,
        tactics: kacper.skills.tactics.score,
        fitness: kacper.skills.fitness.score,
      },
      overallRating: 4,
      visibleToParent: true,
      status: 'published',
    });
    console.log(`  ${review1.title}`);

    const review2 = await Review.create({
      player: players[1]._id,
      coach: coach._id,
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-03-31'),
      type: 'quarterly',
      title: 'Ocena kwartalna Q1 2026 — Julia',
      strengths: 'Julia ma bardzo dobre wyczucie pilki i naturalny talent do gry przy siatce. Jej woleje sa jedne z najlepszych w grupie wiekowej.',
      areasToImprove: 'Kondycja fizyczna wymaga poprawy — meczy 3-setowych nie wytrzymuje na pełnej intensywnosci. Powinna wiecej pracowac nad wydolnoscia.',
      recommendations: 'Dodac 2 sesje kondycyjne tygodniowo (bieganie interwałowe + cwiczenia core). Przygotowac sie mentalnie do turnieju w Krakowie.',
      overallRating: 4,
      visibleToParent: true,
      status: 'published',
    });
    console.log(`  ${review2.title}\n`);

    // ====== Podsumowanie ======

    console.log('========================');
    console.log('Podsumowanie:');
    console.log(`  Użytkownicy: ${await User.countDocuments()}`);
    console.log(`  Zawodnicy: ${await Player.countDocuments()}`);
    console.log(`  Sesje treningowe: ${await Session.countDocuments()}`);
    console.log(`  Płatności: ${await Payment.countDocuments()}`);
    console.log(`  Turnieje: ${await Tournament.countDocuments()}`);
    console.log(`  Wiadomości: ${await Message.countDocuments()}`);
    console.log(`  Oceny: ${await Review.countDocuments()}`);
    console.log('========================\n');
    console.log('Seed zakończony pomyślnie!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Błąd podczas seedowania:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
