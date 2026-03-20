import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';
import Message from '../models/Message.js';

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
    await kacper.save();

    parent.parentProfile = { children: [kacper._id] };
    await parent.save();

    console.log(`\n  Rodzic Anna Nowak powiązany z zawodnikiem Kacper Nowak\n`);

    // ====== Tworzenie sesji treningowych ======

    console.log('Tworzenie sesji treningowych...');

    const now = new Date();
    const sessionsData = [
      {
        player: kacper._id,
        title: 'Trening serwisu',
        daysAgo: 2,
        durationMinutes: 90,
        notes: 'Praca nad płaskim serwisem. Kacper robi postępy w tossie.',
        focusAreas: ['serwis', 'toss'],
      },
      {
        player: kacper._id,
        title: 'Gra z bazy',
        daysAgo: 5,
        durationMinutes: 60,
        notes: 'Ćwiczenie forehandu cross-court. Trzeba popracować nad footworkiem.',
        focusAreas: ['forehand', 'footwork'],
      },
      {
        player: players[1]._id,
        title: 'Trening na siatce',
        daysAgo: 3,
        durationMinutes: 90,
        notes: 'Julia świetnie radzi sobie z wolej forehandowy. Backhand volley wymaga korekty.',
        focusAreas: ['wolej', 'siatka'],
      },
      {
        player: players[1]._id,
        title: 'Przygotowanie turniejowe',
        daysAgo: 7,
        durationMinutes: 120,
        notes: 'Symulacja meczowa. Julia powinna grać bardziej agresywnie na returnach.',
        focusAreas: ['taktyka', 'return'],
      },
      {
        player: players[2]._id,
        title: 'Trening ogólnorozwojowy',
        daysAgo: 1,
        durationMinutes: 60,
        notes: 'Praca nad koordynacją i szybkością. Antoni robi duże postępy w fitness.',
        focusAreas: ['fitness', 'koordynacja'],
      },
    ];

    for (const sData of sessionsData) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - sData.daysAgo);

      await Session.create({
        player: sData.player,
        coach: coach._id,
        date: sessionDate,
        durationMinutes: sData.durationMinutes,
        title: sData.title,
        notes: sData.notes,
        focusAreas: sData.focusAreas,
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
    console.log(`  ${tournament.name}\n`);

    // ====== Podsumowanie ======

    console.log('========================');
    console.log('Podsumowanie:');
    console.log(`  Użytkownicy: ${await User.countDocuments()}`);
    console.log(`  Zawodnicy: ${await Player.countDocuments()}`);
    console.log(`  Sesje treningowe: ${await Session.countDocuments()}`);
    console.log(`  Płatności: ${await Payment.countDocuments()}`);
    console.log(`  Turnieje: ${await Tournament.countDocuments()}`);
    console.log(`  Wiadomości: ${await Message.countDocuments()}`);
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
