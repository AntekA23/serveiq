import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Session from '../models/Session.js';
import Payment from '../models/Payment.js';
import Tournament from '../models/Tournament.js';
import Message from '../models/Message.js';
// Review (legacy) — nie usuwamy modelu ale seed tworzy tylko ReviewSummary
import Club from '../models/Club.js';
import Group from '../models/Group.js';
import Activity from '../models/Activity.js';
import Observation from '../models/Observation.js';
import DevelopmentGoal from '../models/DevelopmentGoal.js';
import Recommendation from '../models/Recommendation.js';
import ReviewSummary from '../models/ReviewSummary.js';
import PlayerBadge from '../models/PlayerBadge.js';
import DevelopmentProgram from '../models/DevelopmentProgram.js';
import Achievement from '../models/Achievement.js';
import { seedDevelopmentPrograms } from './seedDevelopmentPrograms.js';

/**
 * Seed script — wypelnia baze danych pelnym zestawem demo danych
 *
 * Demo Record A: Kacper Nowak — Tennis 10 Red (beginner, 7-9 lat)
 * Demo Record B: Julia Kowalska — Junior Advanced (Sonia-light pathway)
 * Demo Record C: Antoni Wisniewski — Beginner (nowy gracz)
 *
 * Uzycie: npm run seed
 */

// Skill levels: 1=Nowe, 2=Poznaje, 3=Ćwiczy, 4=Stabilne, 5=Mocne
const beginnerSkill = () => Math.floor(Math.random() * 2) + 2; // 2-3
const advancedSkill = () => Math.floor(Math.random() * 2) + 4; // 4-5

const seed = async () => {
  try {
    console.log('🎾 ServeIQ - Seed Script (Full Demo Data)');
    console.log('==========================================\n');

    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/serveiq';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Polaczono z baza danych\n');

    // ====== Czyszczenie WSZYSTKICH kolekcji ======
    console.log('Czyszczenie kolekcji...');
    await Promise.all([
      User.deleteMany({}),
      Player.deleteMany({}),
      Session.deleteMany({}),
      Payment.deleteMany({}),
      Tournament.deleteMany({}),
      Message.deleteMany({}),
      mongoose.connection.collection('reviews').deleteMany({}),
      Club.deleteMany({}),
      Group.deleteMany({}),
      Activity.deleteMany({}),
      Observation.deleteMany({}),
      DevelopmentGoal.deleteMany({}),
      Recommendation.deleteMany({}),
      ReviewSummary.deleteMany({}),
      PlayerBadge.deleteMany({}),
      DevelopmentProgram.deleteMany({}),
      Achievement.deleteMany({}),
    ]);
    console.log('Kolekcje wyczyszczone.\n');

    const now = new Date();
    const daysAgo = (d) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);
      return dt;
    };
    const daysFromNow = (d) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + d);
      return dt;
    };

    // ============================================================
    // 1. USERS
    // ============================================================
    console.log('Tworzenie uzytkownikow...');

    const coach = await User.create({
      email: 'coach@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Tomasz',
      lastName: 'Trenerski',
      phone: '+48 600 100 200',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'head',
        specialization: 'Praca z mlodzieża',
        itfLevel: 'ITF Level 2',
        bio: 'Trener tenisa z 15-letnim doswiadczeniem. Specjalizacja: praca z mlodzieża.',
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

    const parent2 = await User.create({
      email: 'parent2@serveiq.pl',
      password: 'password123',
      role: 'parent',
      firstName: 'Marta',
      lastName: 'Kowalska',
      phone: '+48 602 300 400',
      isActive: true,
      onboardingCompleted: true,
    });

    const admin = await User.create({
      email: 'admin@serveiq.pl',
      password: 'password123',
      role: 'clubAdmin',
      firstName: 'Piotr',
      lastName: 'Zarządca',
      phone: '+48 603 400 500',
      isActive: true,
      onboardingCompleted: true,
      adminProfile: {
        permissions: ['manage_club', 'manage_coaches', 'manage_players', 'view_reports'],
      },
    });

    // Performance team — 4 trenerzy Sonii
    const headCoach = await User.create({
      email: 'coach.head@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Marek',
      lastName: 'Wojciechowski',
      phone: '+48 604 500 600',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'head',
        specialization: 'Trener główny — sztab Sonii Antczak',
        itfLevel: 'ITF Level 3',
        bio: '22 lata doświadczenia. Były trener kadry juniorskiej PZT. Specjalizacja: zawodnicy wyczynowi.',
      },
    });

    const fitnessCoach = await User.create({
      email: 'coach.fitness@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Agnieszka',
      lastName: 'Lewandowska',
      phone: '+48 605 600 700',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'fitness',
        specialization: 'Przygotowanie motoryczne',
        itfLevel: 'NSCA-CSCS',
        bio: 'Mgr AWF. Specjalistka od przygotowania kondycyjnego juniorek tenisowych.',
      },
    });

    const mentalCoach = await User.create({
      email: 'coach.mental@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Paweł',
      lastName: 'Sokołowski',
      phone: '+48 606 700 800',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'mental',
        specialization: 'Psychologia sportowa',
        itfLevel: 'Dr nauk',
        bio: 'Dr psychologii sportowej. Pracował z reprezentacją Polski w tenisie.',
      },
    });

    const physioCoach = await User.create({
      email: 'coach.physio@serveiq.pl',
      password: 'password123',
      role: 'coach',
      firstName: 'Karolina',
      lastName: 'Mazur',
      phone: '+48 607 800 900',
      isActive: true,
      onboardingCompleted: true,
      coachProfile: {
        teamRole: 'physio',
        specialization: 'Fizjoterapia sportowa',
        itfLevel: 'Mgr fizjoterapii',
        bio: 'Specjalistka McKenzie/FMS. 10 lat z młodymi tenisistami.',
      },
    });

    const parent3 = await User.create({
      email: 'parent3@serveiq.pl',
      password: 'password123',
      role: 'parent',
      firstName: 'Anna',
      lastName: 'Antczak',
      phone: '+48 608 900 100',
      isActive: true,
      onboardingCompleted: true,
    });

    console.log(`  Trener:  coach@serveiq.pl   (password123)`);
    console.log(`  Head:    coach.head@serveiq.pl    (password123) — Marek (sztab Sonii)`);
    console.log(`  Fitness: coach.fitness@serveiq.pl (password123) — Agnieszka`);
    console.log(`  Mental:  coach.mental@serveiq.pl  (password123) — dr Paweł`);
    console.log(`  Physio:  coach.physio@serveiq.pl  (password123) — Karolina`);
    console.log(`  Rodzic:  parent@serveiq.pl  (password123) — rodzic Kacpra`);
    console.log(`  Rodzic2: parent2@serveiq.pl (password123) — rodzic Julii`);
    console.log(`  Rodzic3: parent3@serveiq.pl (password123) — Anna Antczak (rodzic Sonii)`);
    console.log(`  Admin:   admin@serveiq.pl   (password123) — koordynator klubu\n`);

    // ============================================================
    // 2. CLUB
    // ============================================================
    console.log('Tworzenie klubu...');

    const club = await Club.create({
      name: 'KT Smecz Warszawa',
      shortName: 'Smecz',
      city: 'Warszawa',
      address: 'ul. Kortowa 15, 02-100 Warszawa',
      phone: '+48 22 123 45 67',
      email: 'biuro@ktsmecz.pl',
      website: 'https://ktsmecz.pl',
      pztLicense: 'PZT/2024/0042',
      pztCertified: true,
      surfaces: ['clay', 'hard', 'indoor-hard'],
      courtsCount: 8,
      courts: [
        { number: 1, name: 'Kort Centralny', surface: 'clay', indoor: false, lighting: true, heated: false, active: true },
        { number: 2, name: 'Kort 2', surface: 'clay', indoor: false, lighting: true, heated: false, active: true },
        { number: 3, name: 'Kort 3', surface: 'clay', indoor: false, lighting: true, heated: false, active: true },
        { number: 4, name: 'Kort 4', surface: 'clay', indoor: false, lighting: false, heated: false, active: true },
        { number: 5, name: 'Kort 5', surface: 'hard', indoor: false, lighting: true, heated: false, active: true },
        { number: 6, name: 'Kort 6', surface: 'hard', indoor: false, lighting: true, heated: false, active: true },
        { number: 7, name: 'Hala A', surface: 'indoor-hard', indoor: true, lighting: true, heated: true, active: true },
        { number: 8, name: 'Hala B', surface: 'indoor-hard', indoor: true, lighting: true, heated: true, active: true },
      ],
      facilities: {
        gym: { available: true, description: 'Siłownia z nowoczesnym sprzętem Technogym' },
        squash: { available: true, courtsCount: 2, description: 'Dwa korty squash ze szklaną ścianą' },
        tableTennis: { available: true, tablesCount: 3, description: 'Stoły turniejowe Butterfly' },
        swimmingPool: { available: false },
        sauna: { available: true, description: 'Sauna fińska i łaźnia parowa' },
        changingRooms: { available: true, description: 'Szatnie męskie i damskie z prysznicami' },
        parking: { available: true, spacesCount: 40, description: 'Bezpłatny parking dla członków klubu' },
        shop: { available: true, description: 'Pro shop — rakiety, odzież, naciągi' },
        cafe: { available: true, description: 'Kawiarnia "Set Point" z widokiem na korty' },
        physio: { available: true, description: 'Gabinet fizjoterapii — masaż sportowy, rehabilitacja' },
        other: [
          { name: 'Sala konferencyjna', description: 'Do spotkań i prezentacji, 20 osób' },
          { name: 'Plac zabaw', description: 'Dla dzieci czekających na zajęcia' },
        ],
      },
      pathwayStages: [
        { name: 'Tennis 10 Red', order: 1, description: 'Pierwsze kroki — kort skrocony, pilka czerwona', ageRange: { min: 4, max: 7 }, color: '#ef4444' },
        { name: 'Tennis 10 Orange', order: 2, description: 'Kort 3/4, pilka pomaranczowa', ageRange: { min: 7, max: 9 }, color: '#f97316' },
        { name: 'Tennis 10 Green', order: 3, description: 'Pelny kort, pilka zielona', ageRange: { min: 9, max: 11 }, color: '#22c55e' },
        { name: 'Junior Beginner', order: 4, description: 'Pelny kort, pilka zwykla — poczatkujacy', ageRange: { min: 10, max: 13 }, color: '#3b82f6' },
        { name: 'Junior Advanced', order: 5, description: 'Zaawansowany junior — turnieje, sparingi', ageRange: { min: 12, max: 16 }, color: '#8b5cf6' },
        { name: 'Performance', order: 6, description: 'Sciezka wyczynowa', ageRange: { min: 14, max: 18 }, color: '#ec4899' },
        { name: 'Adult Recreation', order: 7, description: 'Dorośli rekreacyjnie', ageRange: { min: 18, max: 99 }, color: '#6b7280' },
      ],
      owner: admin._id,
      admins: [admin._id],
      coaches: [coach._id, headCoach._id, fitnessCoach._id, mentalCoach._id, physioCoach._id],
    });

    // Link users to club
    admin.club = club._id;
    coach.club = club._id;
    await Promise.all([admin.save(), coach.save()]);

    headCoach.club = club._id;
    fitnessCoach.club = club._id;
    mentalCoach.club = club._id;
    physioCoach.club = club._id;
    await Promise.all([
      headCoach.save(), fitnessCoach.save(), mentalCoach.save(), physioCoach.save(),
    ]);

    console.log(`  ${club.name} (${club.city}) — ${club.courtsCount} kortow, ${club.pathwayStages.length} etapow\n`);

    // ============================================================
    // 3. PLAYERS
    // ============================================================
    console.log('Tworzenie zawodnikow...');

    // Demo Record A — Tennis 10 child (beginner pathway)
    const kacper = await Player.create({
      firstName: 'Kacper',
      lastName: 'Nowak',
      dateOfBirth: new Date('2017-03-15'),
      gender: 'M',
      coach: coach._id,
      coaches: [coach._id],
      parents: [parent._id],
      club: club._id,
      pathwayStage: 'tennis10_red',
      pathwayHistory: [
        { stage: 'tennis10_red', startDate: new Date('2025-09-01'), notes: 'Dołączył do klubu' },
      ],
      developmentLevel: 'tennis10',
      ranking: { pzt: 0 },
      trainingPlan: {
        weeklySchedule: [
          { day: 2, sessionType: 'kort', durationMinutes: 60, startTime: '16:00', notes: 'Zajecia grupowe Tennis 10' },
          { day: 4, sessionType: 'kort', durationMinutes: 60, startTime: '16:00', notes: 'Zajecia grupowe Tennis 10' },
          { day: 6, sessionType: 'kondycja', durationMinutes: 45, startTime: '10:00', notes: 'Koordynacja i zabawa' },
        ],
        weeklyGoal: { sessionsPerWeek: 3, hoursPerWeek: 3 },
        focus: ['Koordynacja', 'Forehand', 'Zabawa'],
        notes: 'Kacper dopiero zaczyna. Priorytet: radosc z gry i podstawy koordynacji.',
      },
      nextStep: {
        text: 'Kontynuacja w Tennis 10 Red, ocena gotowosci do Orange za 2-3 miesiace',
        updatedAt: daysAgo(5),
        updatedBy: coach._id,
      },
      idol: {
        name: 'Iga Świątek',
        facts: [
          'Iga zaczęła grać w tenisa mając zaledwie 5 lat, inspirowana przez ojca Tomasza, który sam był wioślarzem olimpijskim.',
          'Przed wielkimi meczami Iga słucha muzyki rockowej — to jej sposób na skupienie i kontrolę emocji na korcie.',
          'W 2020 roku Iga wygrała Roland Garros nie tracąc ani jednego seta w całym turnieju — miała wtedy zaledwie 19 lat.',
          'Iga pracuje z psychologiem sportowym od 16. roku życia — uważa, że siła mentalna jest równie ważna jak technika.',
          'Jako juniorka Iga grała na kortach w Raszynie pod Warszawą — daleko od wielkich akademii tenisowych.',
          'Iga Świątek była pierwszą Polką, która zdobyła numer 1 w rankingu WTA, i utrzymała tę pozycję przez ponad rok.',
          'Ulubione ćwiczenie Igi to skakanka — robi ją przed każdym treningiem, bo poprawia koordynację i szybkość nóg.',
        ],
        generatedAt: new Date(),
      },
    });

    // Demo Record B — Sonia-light (advanced junior pathway)
    const julia = await Player.create({
      firstName: 'Julia',
      lastName: 'Kowalska',
      dateOfBirth: new Date('2011-07-22'),
      gender: 'F',
      coach: coach._id,
      coaches: [coach._id],
      parents: [parent2._id],
      club: club._id,
      pathwayStage: 'advanced',
      pathwayHistory: [
        { stage: 'tennis10_green', startDate: new Date('2022-09-01'), endDate: new Date('2023-06-30'), notes: 'Szybki postep' },
        { stage: 'committed', startDate: new Date('2023-09-01'), endDate: new Date('2024-08-31'), notes: 'Pierwsze turnieje' },
        { stage: 'advanced', startDate: new Date('2024-09-01'), notes: 'Regularne turnieje, sciezka wyczynowa' },
      ],
      developmentLevel: 'advanced',
      ranking: { pzt: 28, te: 450 },
      trainingPlan: {
        weeklySchedule: [
          { day: 1, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Trening techniczny' },
          { day: 1, sessionType: 'kondycja', durationMinutes: 45, startTime: '17:00', notes: '' },
          { day: 2, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Taktyka i gra' },
          { day: 3, sessionType: 'rozciaganie', durationMinutes: 30, startTime: '07:00', notes: 'Poranne rozciaganie' },
          { day: 4, sessionType: 'sparing', durationMinutes: 120, startTime: '14:00', notes: 'Mecz treningowy' },
          { day: 5, sessionType: 'kondycja', durationMinutes: 60, startTime: '16:00', notes: 'Interwalowy + core' },
          { day: 6, sessionType: 'kort', durationMinutes: 90, startTime: '10:00', notes: 'Serwis + return' },
        ],
        weeklyGoal: { sessionsPerWeek: 7, hoursPerWeek: 9 },
        focus: ['Serwis', 'Kondycja', 'Rutyny meczowe'],
        notes: 'Julia przygotowuje sie do sezonu turniejowego. Kluczowe: wytrzymalosc i rutyny meczowe.',
      },
      nextStep: {
        text: 'Przygotowanie do turnieju w Krakowie. Cel: polfinał. Potem ocena gotowosci do Performance.',
        updatedAt: daysAgo(3),
        updatedBy: coach._id,
      },
      idol: {
        name: 'Carlos Alcaraz',
        facts: [
          'Carlos zaczął grać w tenisa w wieku 4 lat, trenowany przez ojca Carlosa Sr., który był zawodnikiem na poziomie krajowym.',
          'W wieku 18 lat Alcaraz pokonał Rafaela Nadala — swojego idola z dzieciństwa — w turnieju ATP w Madrycie.',
          'Carlos trenuje w akademii Juana Carlosa Ferrero w Villenie — codziennie wstaje o 7:00 i trenuje 4-5 godzin.',
          'Alcaraz jest znany z „drop shotów" — skrótów, które ćwiczył godzinami jako dziecko, bo uważał je za najbardziej kreatywny zagranie.',
          'W 2022 roku Carlos został najmłodszą „jedynką" w historii rankingu ATP — miał zaledwie 19 lat.',
          'Mimo sukcesów Carlos mówi, że najważniejsza lekcja to nauczyć się przegrywać — „porażki uczą więcej niż wygrane".',
          'Carlos uwielbia grę w padla i PlayStation — uważa, że odpoczynek mentalny jest kluczowy dla osiągania szczytowej formy.',
        ],
        generatedAt: new Date(),
      },
    });

    // Demo Record C — Beginner (freshly joined)
    const antoni = await Player.create({
      firstName: 'Antoni',
      lastName: 'Wiśniewski',
      dateOfBirth: new Date('2018-01-10'),
      gender: 'M',
      coach: coach._id,
      coaches: [coach._id],
      parents: [parent._id],
      club: club._id,
      pathwayStage: 'tennis10_red',
      pathwayHistory: [
        { stage: 'tennis10_red', startDate: new Date('2026-02-01'), notes: 'Nowy w klubie' },
      ],
      developmentLevel: 'beginner',
      ranking: {},
      trainingPlan: {
        weeklySchedule: [
          { day: 2, sessionType: 'kort', durationMinutes: 60, startTime: '16:00', notes: 'Zajecia grupowe Tennis 10' },
          { day: 6, sessionType: 'kort', durationMinutes: 60, startTime: '10:00', notes: 'Zajecia grupowe Tennis 10' },
        ],
        weeklyGoal: { sessionsPerWeek: 2, hoursPerWeek: 2 },
        focus: ['Koordynacja', 'Zabawa'],
        notes: 'Antoni dopiero zaczal. Cel: polubic tenis i nauczyc sie podstaw.',
      },
    });

    // Demo Record D — Sonia (Performance pathway — stress test)
    const sonia = await Player.create({
      firstName: 'Sonia',
      lastName: 'Antczak',
      dateOfBirth: new Date('2012-06-14'),
      gender: 'F',
      coach: headCoach._id,
      coaches: [headCoach._id, fitnessCoach._id, mentalCoach._id, physioCoach._id],
      parents: [parent3._id],
      club: club._id,
      pathwayStage: 'performance',
      pathwayHistory: [
        { stage: 'tennis10_red', startDate: new Date('2018-09-01'), endDate: new Date('2019-08-31') },
        { stage: 'tennis10_orange', startDate: new Date('2019-09-01'), endDate: new Date('2020-08-31') },
        { stage: 'tennis10_green', startDate: new Date('2020-09-01'), endDate: new Date('2021-08-31') },
        { stage: 'committed', startDate: new Date('2021-09-01'), endDate: new Date('2023-08-31') },
        { stage: 'advanced', startDate: new Date('2023-09-01'), endDate: new Date('2024-08-31') },
        { stage: 'performance', startDate: new Date('2024-09-01'), notes: 'Przejście na ścieżkę wyczynową — sponsoring klubowy + program PZT' },
      ],
      developmentLevel: 'performance',
      ranking: { pzt: 3, te: 180, itf: 320 },
      trainingPlan: {
        weeklySchedule: [
          { day: 1, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Technika + serwis+1' },
          { day: 1, sessionType: 'kondycja', durationMinutes: 60, startTime: '17:30', notes: 'Siła + szybkość' },
          { day: 2, sessionType: 'kort', durationMinutes: 120, startTime: '15:00', notes: 'Taktyka' },
          { day: 2, sessionType: 'inne', durationMinutes: 30, startTime: '18:00', notes: 'Sesja mentalna' },
          { day: 3, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Return + gra zaczepna' },
          { day: 3, sessionType: 'rozciaganie', durationMinutes: 60, startTime: '17:30', notes: 'Fizjo + regeneracja' },
          { day: 4, sessionType: 'sparing', durationMinutes: 120, startTime: '14:00', notes: 'Sparing meczowy' },
          { day: 4, sessionType: 'kondycja', durationMinutes: 45, startTime: '17:00', notes: 'Interwały' },
          { day: 5, sessionType: 'kort', durationMinutes: 90, startTime: '15:00', notes: 'Specjalistyka — gra' },
          { day: 5, sessionType: 'inne', durationMinutes: 30, startTime: '17:30', notes: 'Rutyny meczowe' },
          { day: 6, sessionType: 'sparing', durationMinutes: 180, startTime: '10:00', notes: 'Turniej / sparing dlugi' },
          { day: 7, sessionType: 'rozciaganie', durationMinutes: 45, startTime: '11:00', notes: 'Regeneracja' },
        ],
        weeklyGoal: { sessionsPerWeek: 12, hoursPerWeek: 14 },
        focus: ['Plaski serwis', 'Taktyka serwis+1', 'Wytrzymałość 3-setowa', 'Rutyny meczowe', 'Mentalność turniejowa'],
        notes: 'Sponsoring klubowy KT Smecz + program PZT pokrywa koszty treningów i wyjazdów. Cel sezonu 2026: kwalifikacja do ITF Junior tour.',
      },
      nextStep: {
        text: 'MP U16 (czerwiec 2026), potem ITF J60 Pardubice. Cel: wejście do top 200 ITF Junior.',
        updatedAt: new Date(),
        updatedBy: headCoach._id,
      },
      idol: {
        name: 'Iga Świątek',
        facts: [
          'Iga Świątek była pierwszą Polką, która zdobyła numer 1 w rankingu WTA, i utrzymała tę pozycję przez ponad rok.',
          'Iga zaczęła grać w tenisa mając zaledwie 5 lat, inspirowana przez ojca — wioślarza olimpijskiego.',
          'Iga pracuje z psychologiem sportowym od 16. roku życia — uważa, że siła mentalna jest równie ważna jak technika.',
          'W 2020 roku Iga wygrała Roland Garros nie tracąc ani jednego seta w całym turnieju — miała wtedy 19 lat.',
        ],
        generatedAt: new Date(),
      },
    });

    // Linkuj Sonię do parent3
    parent3.parentProfile = { children: [sonia._id] };
    await parent3.save();

    console.log(`  Sonia Antczak — Performance (Demo Record D — Sonia full / stress test)\n`);

    // Link parents
    parent.parentProfile = { children: [kacper._id, antoni._id] };
    parent2.parentProfile = { children: [julia._id] };
    await Promise.all([parent.save(), parent2.save()]);

    console.log(`  Kacper Nowak — Tennis 10 Red (Demo Record A)`);
    console.log(`  Julia Kowalska — Junior Advanced (Demo Record B — Sonia-light)`);
    console.log(`  Antoni Wisniewski — Tennis 10 Red (beginner)\n`);

    // ============================================================
    // 4. GROUPS
    // ============================================================
    console.log('Tworzenie grup...');

    const groupRed = await Group.create({
      club: club._id,
      name: 'Tennis 10 Red — Wtorek/Sobota',
      description: 'Grupa poczatkowa dla dzieci 5-7 lat. Pilka czerwona, kort skrocony.',
      coach: coach._id,
      pathwayStage: 'tennis10_red',
      players: [kacper._id, antoni._id],
      schedule: {
        dayOfWeek: [2, 6],
        startTime: '16:00',
        endTime: '17:00',
        surface: 'clay',
      },
      maxPlayers: 8,
    });

    const groupAdvanced = await Group.create({
      club: club._id,
      name: 'Junior Advanced — Indywidualny',
      description: 'Trening indywidualny i sparingi dla zaawansowanych juniorow.',
      coach: coach._id,
      pathwayStage: 'advanced',
      players: [julia._id],
      schedule: {
        dayOfWeek: [1, 2, 4, 6],
        startTime: '15:00',
        endTime: '16:30',
        surface: 'clay',
      },
      maxPlayers: 4,
    });

    // Link players to groups
    kacper.groups = [groupRed._id];
    antoni.groups = [groupRed._id];
    julia.groups = [groupAdvanced._id];
    await Promise.all([kacper.save(), julia.save(), antoni.save()]);

    console.log(`  ${groupRed.name} (${groupRed.players.length} graczy)`);
    console.log(`  ${groupAdvanced.name} (${groupAdvanced.players.length} graczy)\n`);

    // ============================================================
    // 5. ACTIVITIES (nowy model — sprint 3+)
    // ============================================================
    console.log('Tworzenie aktywnosci...');

    const activities = [];

    // Tennis 10 classes — completed
    const act1 = await Activity.create({
      club: club._id,
      type: 'class',
      title: 'Tennis 10 Red — zajecia grupowe',
      description: 'Zabawa z pilka, koordynacja, podstawy forhandu.',
      date: daysAgo(5),
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      players: [kacper._id, antoni._id],
      coach: coach._id,
      createdBy: coach._id,
      group: groupRed._id,
      location: 'KT Smecz — kort 1',
      surface: 'clay',
      status: 'completed',
      focusAreas: ['koordynacja', 'forehand'],
      notes: 'Obie chlopaki bardzo zaangazowani. Kacper pokazuje postep w forhendzie.',
      attendance: [
        { player: kacper._id, status: 'present' },
        { player: antoni._id, status: 'present' },
      ],
      visibleToParent: true,
    });
    activities.push(act1);

    const act2 = await Activity.create({
      club: club._id,
      type: 'class',
      title: 'Tennis 10 Red — zajecia grupowe',
      description: 'Serwis z dolu, gra na punkty.',
      date: daysAgo(12),
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      players: [kacper._id, antoni._id],
      coach: coach._id,
      createdBy: coach._id,
      group: groupRed._id,
      location: 'KT Smecz — kort 1',
      surface: 'clay',
      status: 'completed',
      focusAreas: ['serwis', 'gra na punkty'],
      notes: 'Antoni jeszcze nie lapie tossu. Kacper gra juz punktowo.',
      attendance: [
        { player: kacper._id, status: 'present' },
        { player: antoni._id, status: 'late' },
      ],
      visibleToParent: true,
    });
    activities.push(act2);

    // Upcoming Tennis 10 class
    const act3 = await Activity.create({
      club: club._id,
      type: 'class',
      title: 'Tennis 10 Red — zajecia grupowe',
      date: daysFromNow(2),
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      players: [kacper._id, antoni._id],
      coach: coach._id,
      createdBy: coach._id,
      group: groupRed._id,
      location: 'KT Smecz — kort 1',
      surface: 'clay',
      status: 'planned',
      focusAreas: ['backhand', 'koordynacja'],
      visibleToParent: true,
    });
    activities.push(act3);

    // Julia — advanced training (completed)
    const act4 = await Activity.create({
      club: club._id,
      type: 'training',
      title: 'Trening techniczny — serwis + return',
      description: 'Praca nad plaskim serwisem i returnem z bekhendu.',
      date: daysAgo(3),
      startTime: '15:00',
      endTime: '16:30',
      durationMinutes: 90,
      players: [julia._id],
      coach: coach._id,
      createdBy: coach._id,
      group: groupAdvanced._id,
      location: 'KT Smecz — kort 3',
      surface: 'clay',
      status: 'completed',
      focusAreas: ['serwis', 'return', 'taktyka'],
      notes: 'Julia robi postepy w plaskim serwisie. Return z bekhendu jeszcze za gleboki.',
      attendance: [{ player: julia._id, status: 'present' }],
      visibleToParent: true,
    });
    activities.push(act4);

    // Julia — match/sparring
    const act5 = await Activity.create({
      club: club._id,
      type: 'match',
      title: 'Sparing — symulacja meczowa',
      description: 'Mecz treningowy z rywalka z innego klubu. Praca nad rutynami meczowymi.',
      date: daysAgo(7),
      startTime: '14:00',
      endTime: '16:00',
      durationMinutes: 120,
      players: [julia._id],
      coach: coach._id,
      createdBy: coach._id,
      location: 'KT Smecz — kort 2',
      surface: 'clay',
      status: 'completed',
      focusAreas: ['rutyny meczowe', 'tie-break', 'opanowanie'],
      notes: 'Julia wygrala 6:4 6:7 7:5. Slaby tie-break w 2. secie — traci pewnosc siebie. 3. set swietna reakcja.',
      attendance: [{ player: julia._id, status: 'present' }],
      visibleToParent: true,
    });
    activities.push(act5);

    // Julia — fitness
    const act6 = await Activity.create({
      club: club._id,
      type: 'fitness',
      title: 'Trening kondycyjny — interwaly + core',
      date: daysAgo(2),
      startTime: '16:00',
      endTime: '17:00',
      durationMinutes: 60,
      players: [julia._id],
      coach: coach._id,
      createdBy: coach._id,
      location: 'KT Smecz — silownia',
      status: 'completed',
      focusAreas: ['wydolnosc', 'core', 'szybkosc'],
      notes: 'Poprawia sie — mniej zmeczona niz 2 tygodnie temu. Kontynuowac interwaly.',
      attendance: [{ player: julia._id, status: 'present' }],
      visibleToParent: true,
    });
    activities.push(act6);

    // Upcoming camp (weekend)
    const act7 = await Activity.create({
      club: club._id,
      type: 'camp',
      title: 'Weekend Tennis Camp — Wielkanoc',
      description: 'Dwudniowy camp dla wszystkich grup. Treningi, turniej wewnetrzny, zabawa.',
      date: daysFromNow(10),
      endDate: daysFromNow(11),
      startTime: '09:00',
      endTime: '15:00',
      durationMinutes: 360,
      players: [kacper._id, julia._id, antoni._id],
      coach: coach._id,
      createdBy: admin._id,
      location: 'KT Smecz — caly obiekt',
      surface: 'clay',
      status: 'planned',
      focusAreas: ['gra turniejowa', 'integracja'],
      visibleToParent: true,
      tags: ['camp', 'wielkanoc'],
    });
    activities.push(act7);

    // Julia — upcoming tournament prep
    const act8 = await Activity.create({
      club: club._id,
      type: 'training',
      title: 'Przygotowanie turniejowe — Krakow',
      date: daysFromNow(5),
      startTime: '15:00',
      endTime: '16:30',
      durationMinutes: 90,
      players: [julia._id],
      coach: coach._id,
      createdBy: coach._id,
      location: 'KT Smecz — kort 3',
      surface: 'clay',
      status: 'planned',
      focusAreas: ['serwis', 'return', 'tie-break'],
      visibleToParent: true,
    });
    activities.push(act8);

    console.log(`  ${activities.length} aktywnosci (${activities.filter(a => a.status === 'completed').length} zakonczone, ${activities.filter(a => a.status === 'planned').length} zaplanowane)\n`);

    // ============================================================
    // 6. SESSIONS (legacy — keep for backward compat)
    // ============================================================
    console.log('Tworzenie sesji treningowych (legacy)...');

    const sessionsData = [
      {
        player: kacper._id,
        title: 'Trening forhandu',
        sessionType: 'kort',
        surface: 'clay',
        startTime: '16:00',
        daysAgo: 5,
        durationMinutes: 60,
        notes: 'Kacper coraz lepiej uderza z dolu. Dobry kontakt z pilka.',
        focusAreas: ['forehand', 'koordynacja'],
      },
      {
        player: julia._id,
        title: 'Serwis i return',
        sessionType: 'kort',
        surface: 'clay',
        startTime: '15:00',
        daysAgo: 3,
        durationMinutes: 90,
        notes: 'Praca nad plaskim serwisem. Return z bekhendu wymaga korekty glebokosci.',
        focusAreas: ['serwis', 'return'],
      },
      {
        player: julia._id,
        title: 'Taktyka meczowa',
        sessionType: 'sparing',
        surface: 'clay',
        startTime: '14:00',
        daysAgo: 7,
        durationMinutes: 120,
        notes: 'Symulacja meczowa. Julia gra bardziej agresywnie na returnach.',
        focusAreas: ['taktyka', 'return'],
      },
      {
        player: julia._id,
        title: 'Trening kondycyjny',
        sessionType: 'kondycja',
        startTime: '16:00',
        daysAgo: 2,
        durationMinutes: 60,
        notes: 'Interwaly + core. Widac poprawe wydolnosci.',
        focusAreas: ['kondycja', 'szybkosc'],
      },
    ];

    for (const sData of sessionsData) {
      await Session.create({
        player: sData.player,
        coach: coach._id,
        createdBy: coach._id,
        source: 'coach',
        date: daysAgo(sData.daysAgo),
        sessionType: sData.sessionType,
        surface: sData.surface || '',
        startTime: sData.startTime || '',
        durationMinutes: sData.durationMinutes,
        title: sData.title,
        notes: sData.notes,
        focusAreas: sData.focusAreas,
        visibleToParent: true,
      });
    }

    // Sonia sessions
    const soniaSessionsData = [
      { title: 'Trening techniczny — serwis + return', sessionType: 'kort', surface: 'clay', startTime: '15:00', daysAgo: 1, durationMinutes: 90, notes: 'Plaski serwis 60% trafień. Return z bekhendu agresywny.', focusAreas: ['serwis', 'return'], coachId: 0 },
      { title: 'Sparing meczowy — symulacja MP', sessionType: 'sparing', surface: 'clay', startTime: '14:00', daysAgo: 7, durationMinutes: 120, notes: 'Sparing z Julią Kowalską. Sonia 6:2 6:3.', focusAreas: ['gra', 'taktyka'], coachId: 0 },
      { title: 'Trening kondycyjny — interwały + siła', sessionType: 'kondycja', startTime: '17:00', daysAgo: 4, durationMinutes: 60, notes: 'Test Coopera 3120m. Core wzmocniony.', focusAreas: ['wydolnosc', 'sila'], coachId: 1 },
      { title: 'Sesja mentalna — rutyny tie-break', sessionType: 'inne', startTime: '17:30', daysAgo: 1, durationMinutes: 30, notes: 'Praca nad rytuałem między punktami.', focusAreas: ['mentalnosc', 'rutyny'], coachId: 2 },
      { title: 'Fizjoterapia + regeneracja', sessionType: 'rozciaganie', startTime: '17:30', daysAgo: 3, durationMinutes: 60, notes: 'Masaż m. czworogłowego, rolowanie, mobilizacja stawów.', focusAreas: ['regeneracja', 'kontuzje'], coachId: 3 },
    ];

    const soniaCoaches = [headCoach, fitnessCoach, mentalCoach, physioCoach];
    for (const sd of soniaSessionsData) {
      await Session.create({
        player: sonia._id,
        coach: soniaCoaches[sd.coachId]._id,
        createdBy: soniaCoaches[sd.coachId]._id,
        source: 'coach',
        date: daysAgo(sd.daysAgo),
        sessionType: sd.sessionType,
        surface: sd.surface || '',
        startTime: sd.startTime || '',
        durationMinutes: sd.durationMinutes,
        title: sd.title,
        notes: sd.notes,
        focusAreas: sd.focusAreas,
        visibleToParent: true,
      });
    }
    console.log(`  ${sessionsData.length + soniaSessionsData.length} sesji treningowych\n`);

    // ============================================================
    // 7. DEVELOPMENT GOALS
    // ============================================================
    console.log('Tworzenie celow rozwojowych...');

    // Kacper — Tennis 10 goals
    const goalK1 = await DevelopmentGoal.create({
      player: kacper._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Stabilny forehand z dolu',
      description: 'Kacper powinien potrafic odegrać 5 pilk forhendowych z dolu bez bledu.',
      category: 'fundamentals',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-15'),
      targetDate: new Date('2026-06-30'),
      status: 'active',
      progress: 40,
      visibleToParent: true,
    });

    const goalK2 = await DevelopmentGoal.create({
      player: kacper._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Koordynacja i rownowaga',
      description: 'Cwiczenia z drabinka, skakanki, gry z pilka. Cel: plynnosc ruchow na korcie.',
      category: 'movement',
      timeframe: 'monthly',
      startDate: new Date('2026-03-01'),
      targetDate: new Date('2026-04-30'),
      status: 'active',
      progress: 60,
      visibleToParent: true,
    });

    const goalK3 = await DevelopmentGoal.create({
      player: kacper._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Radosc z gry i pewnosc siebie',
      description: 'Kacper powinien cieszyc sie z gry i nie bac sie rywalizacji.',
      category: 'confidence',
      timeframe: 'seasonal',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-08-31'),
      status: 'active',
      progress: 70,
      visibleToParent: true,
    });

    // Julia — advanced goals (Sonia-light)
    const goalJ1 = await DevelopmentGoal.create({
      player: julia._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Plaski serwis — regularnosc i predkosc',
      description: 'Julia musi rozwinac plaski serwis jako bron. Cel: 65% pierwszych serwisow w meczu.',
      category: 'serve',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-06-30'),
      status: 'active',
      progress: 45,
      visibleToParent: true,
    });

    const goalJ2 = await DevelopmentGoal.create({
      player: julia._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Rutyny meczowe i opanowanie',
      description: 'Praca nad rutynam miedzy punktami. Cel: stabile emocje w tie-breakach.',
      category: 'match-routines',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-06-30'),
      status: 'active',
      progress: 30,
      visibleToParent: true,
    });

    const goalJ3 = await DevelopmentGoal.create({
      player: julia._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Wytrzymalosc na mecze 3-setowe',
      description: 'Julia musi byc w stanie grac 3 sety na pelnej intensywnosci. Interwaly 3x/tydzien.',
      category: 'fitness',
      timeframe: 'monthly',
      startDate: new Date('2026-03-01'),
      targetDate: new Date('2026-05-31'),
      status: 'active',
      progress: 55,
      visibleToParent: true,
    });

    // Antoni — basic goal
    const goalA1 = await DevelopmentGoal.create({
      player: antoni._id,
      club: club._id,
      createdBy: coach._id,
      title: 'Nauczyc sie prawidlowego chwytu rakiety',
      description: 'Antoni musi opanowac chwyt continental i eastern forehand.',
      category: 'fundamentals',
      timeframe: 'monthly',
      startDate: new Date('2026-03-01'),
      targetDate: new Date('2026-04-30'),
      status: 'active',
      progress: 25,
      visibleToParent: true,
    });

    // Sonia — performance goals
    const goalS1 = await DevelopmentGoal.create({
      player: sonia._id,
      club: club._id,
      createdBy: headCoach._id,
      title: 'Plaski serwis 170 km/h',
      description: 'Sonia musi zwiększyć prędkość pierwszego serwisu do 170+ km/h przy 60% trafień.',
      category: 'serve',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-09-30'),
      status: 'active',
      progress: 60,
      visibleToParent: true,
    });

    const goalS2 = await DevelopmentGoal.create({
      player: sonia._id,
      club: club._id,
      createdBy: fitnessCoach._id,
      title: 'Wytrzymałość — mecze 3-setowe na pełnej intensywności',
      description: 'Cel: utrzymać poziom intensywności w 3. secie identyczny jak w 1. (HR avg, prędkość biegu).',
      category: 'fitness',
      timeframe: 'quarterly',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-06-30'),
      status: 'active',
      progress: 70,
      visibleToParent: true,
    });

    const goalS3 = await DevelopmentGoal.create({
      player: sonia._id,
      club: club._id,
      createdBy: headCoach._id,
      title: 'Wejście do ITF Junior tour 2027',
      description: 'Kwalifikacja do regularnych turniejów ITF Junior. Cel: top 200 ITF Junior do końca 2026.',
      category: 'pathway',
      timeframe: 'seasonal',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      status: 'active',
      progress: 35,
      visibleToParent: true,
    });

    console.log(`  10 celow rozwojowych (3 Kacper, 3 Julia, 1 Antoni, 3 Sonia)\n`);

    // ============================================================
    // 8. OBSERVATIONS
    // ============================================================
    console.log('Tworzenie obserwacji...');

    // Kacper observations
    const obs1 = await Observation.create({
      player: kacper._id,
      club: club._id,
      activity: act1._id,
      author: coach._id,
      type: 'progress',
      text: 'Kacper dzis swietnie uderzal forhend z dolu. Widac postep w koordynacji — plynniej sie porusza. Bardzo zaangazowany w cwiczenia.',
      engagement: 5,
      effort: 4,
      mood: 5,
      focusAreas: ['forehand', 'koordynacja'],
      goalRef: goalK1._id,
      visibleToParent: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    });

    const obs2 = await Observation.create({
      player: kacper._id,
      club: club._id,
      activity: act2._id,
      author: coach._id,
      type: 'participation',
      text: 'Kacper gral na punkty pierwszy raz. Troche sie stresowal ale szybko sie wkrecil. Serwis z dolu — jeszcze musi popracowac nad tossem.',
      engagement: 4,
      effort: 4,
      mood: 3,
      focusAreas: ['serwis', 'gra na punkty'],
      visibleToParent: true,
      createdAt: daysAgo(12),
      updatedAt: daysAgo(12),
    });

    // Julia observations (Sonia-light)
    const obs3 = await Observation.create({
      player: julia._id,
      club: club._id,
      activity: act4._id,
      author: coach._id,
      type: 'progress',
      text: 'Serwis plaski sie poprawia — Julia zaczyna trafiać regularnie. Return z bekhendu jeszcze za gleboki, trzeba pracowac nad agresywnym pozycjonowaniem.',
      engagement: 5,
      effort: 5,
      mood: 4,
      focusAreas: ['serwis', 'return'],
      goalRef: goalJ1._id,
      visibleToParent: true,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    });

    const obs4 = await Observation.create({
      player: julia._id,
      club: club._id,
      activity: act5._id,
      author: coach._id,
      type: 'concern',
      text: 'W tie-breaku 2. seta Julia calkowicie stracila rytm. Widac ze presja ja blokuje — przestaje oddychac, przyspiesza miedzy punktami. Trzeba wrocic do rutin.',
      engagement: 4,
      effort: 5,
      mood: 2,
      focusAreas: ['rutyny meczowe', 'opanowanie'],
      goalRef: goalJ2._id,
      visibleToParent: true,
      pinned: true,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    });

    const obs5 = await Observation.create({
      player: julia._id,
      club: club._id,
      activity: act5._id,
      author: coach._id,
      type: 'highlight',
      text: 'Fantastyczna reakcja w 3. secie! Julia zebrala sie po slabym tie-breaku i wygrala 7:5. To pokazuje mentalny postep — potrafi sie odbic.',
      engagement: 5,
      effort: 5,
      mood: 5,
      focusAreas: ['mental', 'determinacja'],
      visibleToParent: true,
      createdAt: daysAgo(7),
      updatedAt: daysAgo(7),
    });

    const obs6 = await Observation.create({
      player: julia._id,
      club: club._id,
      activity: act6._id,
      author: coach._id,
      type: 'progress',
      text: 'Kondycja sie poprawia. Julia mniej zmeczona niz 2 tygodnie temu na tych samych interwalach. Core stabilniejszy.',
      engagement: 4,
      effort: 5,
      mood: 4,
      focusAreas: ['wydolnosc', 'core'],
      goalRef: goalJ3._id,
      visibleToParent: true,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    });

    // Antoni observation
    const obs7 = await Observation.create({
      player: antoni._id,
      club: club._id,
      activity: act1._id,
      author: coach._id,
      type: 'general',
      text: 'Antoni jest bardzo ruchliwy i chetny. Na razie ciezko mu utrzymac chwyt — wymaga systematycznej pracy. Ale swietna energia!',
      engagement: 5,
      effort: 3,
      mood: 5,
      focusAreas: ['chwyt', 'koordynacja'],
      goalRef: goalA1._id,
      visibleToParent: true,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    });

    // Sonia observations — różne od każdego z 4 trenerów
    const obsS1 = await Observation.create({
      player: sonia._id, club: club._id, author: headCoach._id, type: 'progress',
      text: 'Plaski serwis Sonii notuje 158 km/h średnio (poprzedni miesiąc 152). Pracujemy nad ułożeniem barku — pierwszy ruch.',
      engagement: 5, effort: 5, mood: 4, focusAreas: ['serwis', 'technika'], goalRef: goalS1._id, visibleToParent: true,
      createdAt: daysAgo(2), updatedAt: daysAgo(2),
    });
    const obsS2 = await Observation.create({
      player: sonia._id, club: club._id, author: fitnessCoach._id, type: 'progress',
      text: 'Test Coopera: 3120m (poprzedni 3050m). VO2max stabilny 52 ml/kg/min. Core wyraźnie mocniejszy.',
      engagement: 4, effort: 5, mood: 4, focusAreas: ['kondycja', 'wytrzymalosc'], goalRef: goalS2._id, visibleToParent: true,
      createdAt: daysAgo(4), updatedAt: daysAgo(4),
    });
    const obsS3 = await Observation.create({
      player: sonia._id, club: club._id, author: mentalCoach._id, type: 'highlight',
      text: 'Sesja 30min — rutyny tie-break. Sonia bardzo świadoma swoich emocji, sama identyfikuje moment „spadku" w 2. secie. Doskonała refleksja.',
      engagement: 5, effort: 5, mood: 5, focusAreas: ['mentalnosc', 'rutyny'], visibleToParent: true,
      createdAt: daysAgo(1), updatedAt: daysAgo(1),
    });
    const obsS4 = await Observation.create({
      player: sonia._id, club: club._id, author: physioCoach._id, type: 'concern',
      text: 'Drobne napięcie m. czworogłowego prawego po sparingu. Obserwacja, masaż + rolowanie. Nie ograniczać obciążeń, ale monitorować przez tydzień.',
      engagement: 3, effort: 4, mood: 3, focusAreas: ['regeneracja', 'kontuzje'], visibleToParent: true, pinned: true,
      createdAt: daysAgo(3), updatedAt: daysAgo(3),
    });
    const obsS5 = await Observation.create({
      player: sonia._id, club: club._id, author: headCoach._id, type: 'highlight',
      text: 'Sparing z Julią Kowalską (Junior Advanced). Sonia wygrywa 6:2 6:3 — agresywne returny, świetny serwis+1. Widać dystans poziomu.',
      engagement: 5, effort: 5, mood: 5, focusAreas: ['gra', 'serwis-1', 'taktyka'], visibleToParent: true,
      createdAt: daysAgo(7), updatedAt: daysAgo(7),
    });
    const obsS6 = await Observation.create({
      player: sonia._id, club: club._id, author: headCoach._id, type: 'progress',
      text: 'Tygodniowe podsumowanie: 12 sesji, 14h pracy. Plan zrealizowany w 100%. Forma rośnie przed MP U16.',
      engagement: 5, effort: 5, mood: 4, focusAreas: ['plan', 'dyscyplina'], visibleToParent: true,
      createdAt: daysAgo(0), updatedAt: daysAgo(0),
    });

    console.log(`  13 obserwacji (2 Kacper, 4 Julia, 1 Antoni, 6 Sonia)\n`);

    // Legacy Review model — pomijamy, API uzywa wylacznie ReviewSummary

    // ============================================================
    // 10. REVIEW SUMMARIES (nowy model)
    // ============================================================
    console.log('Tworzenie przeglądow (ReviewSummary)...');

    const reviewSum1 = await ReviewSummary.create({
      player: julia._id,
      club: club._id,
      author: coach._id,
      title: 'Przeglad miesieczny — marzec 2026 — Julia',
      periodType: 'monthly',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      whatHappened: 'Julia miala intensywny marzec: 12 treningow, 3 sparingi, 4 sesje kondycyjne. Wzięła udział w sparingu z zawodniczka z KT Legia.',
      whatWentWell: 'Serwis plaski — widac wyrazny postep, regularnosc i predkosc rosna. Forehand stabilny. Swietna reakcja mentalna w 3. secie sparingu (7:5 po przegranym tie-breaku).',
      whatNeedsFocus: 'Tie-breaki — Julia traci rytm pod presja. Return z bekhendu za gleboki. Kondycja lepsza ale jeszcze nie na poziomie 3-setowych meczy.',
      nextSteps: 'Intensyfikacja przygotowania do turnieju w Krakowie (kwiecien). Dodac cwiczenia tie-break pod presja. Kontynuowac interwaly kondycyjne.',
      activitiesCount: 19,
      goalsReviewed: [goalJ1._id, goalJ2._id, goalJ3._id],
      observations: [obs3._id, obs4._id, obs5._id, obs6._id],
      status: 'published',
      publishedAt: daysAgo(3),
      visibleToParent: true,
    });

    const reviewSum2 = await ReviewSummary.create({
      player: kacper._id,
      club: club._id,
      author: coach._id,
      title: 'Przeglad miesieczny — marzec 2026 — Kacper',
      periodType: 'monthly',
      periodStart: new Date('2026-03-01'),
      periodEnd: new Date('2026-03-31'),
      whatHappened: 'Kacper uczestniczyl w 8 zajeciach grupowych i 2 sesjach koordynacyjnych. Zaczal grac na punkty (mini-turniej wewnetrzny).',
      whatWentWell: 'Forehand z dolu — wyrazny postep, Kacper trafia coraz regularniej. Koordynacja rosnie. Bardzo zaangazowany i chetny do nauki.',
      whatNeedsFocus: 'Serwis — toss niestabilny, czesto nie trafia. Bekhend poczatkowy — trzeba zaczac systematyczna prace.',
      nextSteps: 'Kontynuowac 3x/tydz. Dodac cwiczenia tossu w domu (5 min dziennie). Za 2-3 miesiace ocena gotowosci do Tennis 10 Orange.',
      activitiesCount: 10,
      goalsReviewed: [goalK1._id, goalK2._id],
      observations: [obs1._id, obs2._id],
      status: 'published',
      publishedAt: daysAgo(2),
      visibleToParent: true,
    });

    const reviewSumS = await ReviewSummary.create({
      player: sonia._id, club: club._id, author: headCoach._id,
      title: 'Przegląd kwartalny Q1/2026 — Sonia',
      periodType: 'quarterly',
      periodStart: new Date('2026-01-01'),
      periodEnd: new Date('2026-03-31'),
      whatHappened: 'Sonia zrealizowała 156h treningów (plan 168h, 93%). 4 sparingi turniejowe, sesje fizjo regularnie. Brak kontuzji.',
      whatWentWell: 'Plaski serwis: progres 152→158 km/h. Test Coopera +70m. Stabilność emocji w sparingach — widać efekt pracy z dr Sokołowskim.',
      whatNeedsFocus: 'Tie-breaki — wciąż obszar do pracy. Return z prawej strony wymaga większej agresji. Drobne napięcie m. czworogłowego — monitoring.',
      nextSteps: 'Przygotowanie do MP U16 (czerwiec). Intensyfikacja serwis+1, kontynuacja sesji mentalnych 2x/tydz, regularne wizyty u fizjoterapeuty.',
      activitiesCount: 156,
      goalsReviewed: [goalS1._id, goalS2._id, goalS3._id],
      observations: [obsS1._id, obsS2._id, obsS3._id, obsS4._id, obsS5._id, obsS6._id],
      status: 'published',
      publishedAt: daysAgo(5),
      visibleToParent: true,
    });

    console.log(`  3 przeglady (Kacper marzec, Julia marzec, Sonia Q1)\n`);

    // ============================================================
    // 11. RECOMMENDATIONS
    // ============================================================
    console.log('Tworzenie rekomendacji...');

    await Recommendation.create({
      player: kacper._id,
      club: club._id,
      author: coach._id,
      review: reviewSum2._id,
      type: 'activity-suggest',
      title: 'Dodac cwiczenia tossu w domu',
      description: 'Kacper powinien codziennie przez 5 minut cwiczye toss przed lustrem. Rodzic moze pomoc — pilka powinna opadac na wyciagnieta reke.',
      priority: 'medium',
      status: 'accepted',
      visibleToParent: true,
    });

    await Recommendation.create({
      player: kacper._id,
      club: club._id,
      author: coach._id,
      type: 'pathway-advance',
      title: 'Ocena gotowosci do Tennis 10 Orange',
      description: 'Za 2-3 miesiace (czerwiec/lipiec) ocenic czy Kacper jest gotowy do przejscia na Tennis 10 Orange. Kryteria: stabilny forehand, podstawowy serwis, gra na punkty.',
      priority: 'low',
      status: 'pending',
      visibleToParent: true,
    });

    await Recommendation.create({
      player: julia._id,
      club: club._id,
      author: coach._id,
      review: reviewSum1._id,
      type: 'focus-change',
      title: 'Priorytet: rutyny meczowe przed turniejem',
      description: 'Przez nastepne 2 tygodnie przed turniejem w Krakowie skupic sie na rutynach meczowych: oddech, przerwy, tie-break scenariusze. Odlozyc prace nad returnem.',
      priority: 'high',
      status: 'in-progress',
      visibleToParent: true,
    });

    await Recommendation.create({
      player: julia._id,
      club: club._id,
      author: coach._id,
      type: 'workload-adjust',
      title: 'Zwiekszyc interwaly do 3x/tydzien',
      description: 'Julia musi poprawic wytrzymalosc. Dodac trzecia sesje kondycyjna — interwaly 4x4min z 2min przerwy.',
      priority: 'high',
      status: 'accepted',
      visibleToParent: true,
    });

    await Recommendation.create({
      player: julia._id,
      club: club._id,
      author: coach._id,
      type: 'pathway-advance',
      title: 'Ocena gotowosci do sciezki Performance',
      description: 'Pod koniec sezonu (wrzesien) ocenic czy Julia powinna przejsc na sciezke Performance. Kryteria: wyniki turniejowe, dyscyplina treningowa, gotowosci fizyczna.',
      priority: 'medium',
      status: 'pending',
      visibleToParent: true,
    });

    console.log(`  5 rekomendacji (2 Kacper, 3 Julia)\n`);

    // ============================================================
    // 12. TOURNAMENTS
    // ============================================================
    console.log('Tworzenie turniejow...');

    await Tournament.create({
      player: julia._id,
      coach: coach._id,
      createdBy: coach._id,
      source: 'coach',
      name: 'Ogólnopolski Turniej Mlodziezowy — Kraków',
      location: 'Kraków, KS Olsza',
      surface: 'clay',
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-04-18'),
      category: 'U14',
      drawSize: 32,
      status: 'planned',
      notes: 'Cel: polfinał. Julia jest 5. rozstawiona.',
    });

    await Tournament.create({
      player: julia._id,
      coach: coach._id,
      createdBy: coach._id,
      source: 'coach',
      name: 'Mazowiecki Turniej Juniorek',
      location: 'Warszawa, KT Mera',
      surface: 'hard',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-03'),
      category: 'U14',
      drawSize: 16,
      status: 'completed',
      result: {
        round: 'Polfinał',
        wins: 2,
        losses: 1,
      },
      notes: 'Dobry wynik. Przegrana w polfinalе po slabym 2. secie.',
    });

    await Tournament.create({
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
      notes: 'Pierwszy turniej Kacpra!',
    });

    await Tournament.create({
      player: sonia._id, coach: headCoach._id, createdBy: headCoach._id, source: 'coach',
      name: 'Mistrzostwa Polski U16',
      location: 'Sopot, KT Arka',
      surface: 'clay',
      startDate: new Date('2026-06-12'),
      endDate: new Date('2026-06-15'),
      category: 'U16',
      drawSize: 32,
      status: 'planned',
      notes: 'Cel: półfinał. Sonia rozstawiona z 3.',
    });

    await Tournament.create({
      player: sonia._id, coach: headCoach._id, createdBy: headCoach._id, source: 'coach',
      name: 'ITF J60 Bytom',
      location: 'Bytom, KT Górnik',
      surface: 'hard',
      startDate: new Date('2026-07-08'),
      endDate: new Date('2026-07-13'),
      category: 'ITF Junior J60',
      drawSize: 64,
      status: 'planned',
      notes: 'Drugi start ITF. Cel: ćwierćfinał + punkty rankingowe.',
    });

    console.log(`  5 turniejow (2 Julia, 1 Kacper, 2 Sonia)\n`);

    // ============================================================
    // 12.5 ACHIEVEMENTS — palmares Sonii
    // ============================================================
    console.log('Tworzenie palmaresu Sonii...');

    await Achievement.insertMany([
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U10 — singel', ageCategory: 'U10', discipline: 'singel', year: 2021, date: new Date('2021-08-15'), location: 'Bydgoszcz', result: 'gold', description: 'Pierwszy tytuł mistrzowski. Finał wygrany 6:2 6:1.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U10 — debel', ageCategory: 'U10', discipline: 'debel', year: 2022, date: new Date('2022-04-20'), location: 'Sopot', result: 'gold', description: 'Mistrzostwo w deblu z partnerką z KT Mera.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U12 — singel', ageCategory: 'U12', discipline: 'singel', year: 2022, date: new Date('2022-08-12'), location: 'Wrocław', result: 'gold', description: 'Drugi tytuł singlowy w wieku zaledwie 10 lat.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U12 — debel', ageCategory: 'U12', discipline: 'debel', year: 2023, date: new Date('2023-04-18'), location: 'Łódź', result: 'gold', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Halowe Mistrzostwa Polski U12', ageCategory: 'U12', discipline: 'singel', year: 2023, date: new Date('2023-12-09'), location: 'Poznań', result: 'gold', description: 'Bez straty seta w całym turnieju.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Halowe Mistrzostwa Polski U14', ageCategory: 'U14', discipline: 'singel', year: 2024, date: new Date('2024-12-08'), location: 'Warszawa', result: 'gold', description: 'Najmłodsza mistrzyni U14 halowych w historii klubu.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'mp', title: 'Mistrzostwa Polski U14 — singel', ageCategory: 'U14', discipline: 'singel', year: 2025, date: new Date('2025-08-17'), location: 'Kraków', result: 'gold', description: 'Siódmy tytuł mistrzowski. Finał 7:5 6:3.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'international', title: 'Tennis Europe U14 — Bratislava', ageCategory: 'U14', discipline: 'singel', year: 2024, date: new Date('2024-10-12'), location: 'Bratysława', result: 'finalist', description: 'Pierwszy międzynarodowy finał. Porażka w 3 setach.', visibleToParent: true, createdBy: headCoach._id },
      { player: sonia._id, club: club._id, category: 'international', title: 'ITF J60 Pardubice', ageCategory: 'U18', discipline: 'singel', year: 2025, date: new Date('2025-10-19'), location: 'Pardubice', result: 'quarterfinal', description: 'Pierwszy turniej ITF Junior — ćwierćfinał na poziomie J60.', visibleToParent: true, createdBy: headCoach._id },
    ]);

    console.log(`  9 osiągnięć Sonii (7 MP + 2 międzynarodowe)\n`);

    // ============================================================
    // 13. PAYMENTS
    // ============================================================
    console.log('Tworzenie platnosci...');

    await Payment.create({
      player: kacper._id,
      coach: coach._id,
      parent: parent._id,
      amount: 400,
      currency: 'PLN',
      description: 'Zajecia Tennis 10 — marzec 2026',
      dueDate: new Date('2026-03-10'),
      status: 'paid',
      paidAt: new Date('2026-03-08'),
    });

    await Payment.create({
      player: kacper._id,
      coach: coach._id,
      parent: parent._id,
      amount: 400,
      currency: 'PLN',
      description: 'Zajecia Tennis 10 — kwiecien 2026',
      dueDate: new Date('2026-04-10'),
      status: 'pending',
    });

    await Payment.create({
      player: julia._id,
      coach: coach._id,
      parent: parent2._id,
      amount: 1200,
      currency: 'PLN',
      description: 'Trening indywidualny — marzec 2026',
      dueDate: new Date('2026-03-10'),
      status: 'paid',
      paidAt: new Date('2026-03-12'),
    });

    await Payment.create({
      player: julia._id,
      coach: coach._id,
      parent: parent2._id,
      amount: 1200,
      currency: 'PLN',
      description: 'Trening indywidualny — kwiecien 2026',
      dueDate: new Date('2026-04-10'),
      status: 'pending',
    });

    console.log(`  4 platnosci (2 Kacper, 2 Julia)\n`);

    // ============================================================
    // 14. MESSAGES
    // ============================================================
    console.log('Tworzenie wiadomosci...');

    const messagesData = [
      { from: coach._id, to: parent._id, text: 'Dzien dobry! Kacper swietnie sie dzis spisal na zajeciach. Widac postep w forhendzie!', daysAgo: 5 },
      { from: parent._id, to: coach._id, text: 'Dziekujemy! Kacper nie moze sie doczekac nastepnych zajec 😊', daysAgo: 5 },
      { from: coach._id, to: parent._id, text: 'Moglibyscie w domu pocwiczye toss? 5 minut dziennie wystarczy — rzucanie pilki w gore i lapanie.', daysAgo: 3 },
      { from: parent._id, to: coach._id, text: 'Jasne! Kacper juz cwiczyl dzis wieczorem. Chce grac turniejе — pierwszy w kwietniu?', daysAgo: 2 },
      { from: coach._id, to: parent._id, text: 'Tak, turniej Tennis 10 w naszym klubie 25-26 kwietnia. Zapisalem Kacpra. Bedzie super doswiadczenie!', daysAgo: 1 },
      { from: coach._id, to: parent2._id, text: 'Dzien dobry! Julia robi postepy w serwisie. Przed turniejem w Krakowie skupimy sie na rutynach meczowych.', daysAgo: 3 },
      { from: parent2._id, to: coach._id, text: 'Swietnie. Julia jest troche zestresowana turniejem. Moze jakies wskazowki jak ja wspierac?', daysAgo: 2 },
      { from: coach._id, to: parent2._id, text: 'Najwazniejsze — nie komentowac gry w trakcie meczu. Wspierac niezaleznie od wyniku. Julia sama najlepiej wie co robi na korcie.', daysAgo: 1 },
      { from: headCoach._id, to: parent3._id, text: 'Pani Anno, Sonia świetnie pracowała w tym tygodniu. Plan przed MP U16 idzie zgodnie z założeniami.', daysAgo: 4 },
      { from: parent3._id, to: headCoach._id, text: 'Dziękuję! Jak Pan ocenia jej formę? Czy myśli Pan o dodatkowych startach przed MP?', daysAgo: 3 },
      { from: headCoach._id, to: parent3._id, text: 'Forma rosnąca. Sugeruję jeszcze ITF J60 Bytom (lipiec) i ewentualnie sparing wyjazdowy z KT Legia. Na MP U16 jesteśmy dobrze przygotowani.', daysAgo: 2 },
      { from: parent3._id, to: headCoach._id, text: 'Świetnie. A co z lekkim napięciem w nodze, o którym pisała Karolina?', daysAgo: 1 },
      { from: headCoach._id, to: parent3._id, text: 'Pod kontrolą. Karolina zaleciła monitoring + masaż 2x/tydz. Bez ograniczeń obciążeń.', daysAgo: 1 },
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
    console.log(`  ${messagesData.length} wiadomosci\n`);

    // ============================================================
    // PROGRAMY ROZWOJU FEDERACJI
    // ============================================================
    console.log('\n--- Programy rozwoju federacji ---');
    const allPrograms = await seedDevelopmentPrograms();
    const itfProgram = allPrograms.find(p => p.federationCode === 'itf');

    if (itfProgram) {
      const kacperStage = 'mini_tennis';
      kacper.federationProgram = {
        program: itfProgram._id,
        currentStageCode: kacperStage,
        stageConfirmedAt: new Date(),
        stageConfirmedBy: coach._id,
        autoSuggestedStage: kacperStage,
      };
      kacper.markModified('federationProgram');
      await kacper.save();

      const juliaStage = 'train_to_train';
      julia.federationProgram = {
        program: itfProgram._id,
        currentStageCode: juliaStage,
        stageConfirmedAt: new Date(),
        stageConfirmedBy: coach._id,
        autoSuggestedStage: juliaStage,
      };
      julia.markModified('federationProgram');
      await julia.save();

      const antoniStage = 'mini_tennis';
      antoni.federationProgram = {
        program: itfProgram._id,
        currentStageCode: antoniStage,
        stageConfirmedAt: new Date(),
        stageConfirmedBy: coach._id,
        autoSuggestedStage: antoniStage,
      };
      antoni.markModified('federationProgram');
      await antoni.save();

      console.log('  Przypisano program ITF do 3 graczy');
    }

    // ============================================================
    // ODZNAKI (GAMIFIKACJA)
    // ============================================================
    console.log('\n--- Odznaki ---');

    // Kacper — aktywny gracz, kilka odznak
    await PlayerBadge.insertMany([
      { player: kacper._id, badgeSlug: 'first-session', earnedAt: new Date('2026-02-15') },
      { player: kacper._id, badgeSlug: 'regular-player', earnedAt: new Date('2026-03-10') },
      { player: kacper._id, badgeSlug: 'weekly-streak', earnedAt: new Date('2026-03-20') },
      { player: kacper._id, badgeSlug: 'hours-10', earnedAt: new Date('2026-03-01') },
      { player: kacper._id, badgeSlug: 'tournament-debut', earnedAt: new Date('2026-04-01') },
      { player: kacper._id, badgeSlug: 'goal-achieved', earnedAt: new Date('2026-03-28') },
    ]);
    console.log('  Kacper: 6 odznak');

    // Julia — zaawansowana, dużo odznak + ręczne od trenera
    await PlayerBadge.insertMany([
      { player: julia._id, badgeSlug: 'first-session', earnedAt: new Date('2025-09-01') },
      { player: julia._id, badgeSlug: 'regular-player', earnedAt: new Date('2025-10-15') },
      { player: julia._id, badgeSlug: 'session-25', earnedAt: new Date('2025-12-01') },
      { player: julia._id, badgeSlug: 'training-machine', earnedAt: new Date('2026-01-20') },
      { player: julia._id, badgeSlug: 'hours-10', earnedAt: new Date('2025-10-01') },
      { player: julia._id, badgeSlug: 'hours-50', earnedAt: new Date('2026-01-10') },
      { player: julia._id, badgeSlug: 'weekly-streak', earnedAt: new Date('2025-10-01') },
      { player: julia._id, badgeSlug: 'streak-master', earnedAt: new Date('2025-11-15') },
      { player: julia._id, badgeSlug: 'tournament-debut', earnedAt: new Date('2025-11-01') },
      { player: julia._id, badgeSlug: 'winner', earnedAt: new Date('2026-01-15') },
      { player: julia._id, badgeSlug: 'tournament-5', earnedAt: new Date('2026-03-01') },
      { player: julia._id, badgeSlug: 'finalist', earnedAt: new Date('2026-03-15') },
      { player: julia._id, badgeSlug: 'court-traveler', earnedAt: new Date('2026-02-20') },
      { player: julia._id, badgeSlug: 'goal-achieved', earnedAt: new Date('2026-01-05') },
      { player: julia._id, badgeSlug: 'three-goals', earnedAt: new Date('2026-02-10') },
      { player: julia._id, badgeSlug: 'pathway-advance', earnedAt: new Date('2026-01-01') },
      // Ręczne odznaki od trenera
      { player: julia._id, badgeSlug: 'coach-mvp', earnedAt: new Date('2026-04-01'), type: 'manual', awardedBy: coach._id, awardedNote: 'Świetna postawa na turnieju w Krakowie!' },
      { player: julia._id, badgeSlug: 'coach-sportsmanship', earnedAt: new Date('2026-03-20'), type: 'manual', awardedBy: coach._id, awardedNote: 'Zawsze fair play na korcie.' },
    ]);
    console.log('  Julia: 18 odznak (w tym 2 ręczne od trenera)');

    // Antoni — nowy, tylko pierwsza sesja
    await PlayerBadge.insertMany([
      { player: antoni._id, badgeSlug: 'first-session', earnedAt: new Date('2026-04-02') },
    ]);
    console.log('  Antoni: 1 odznaka');

    // Sonia — najwięcej odznak (performance pathway)
    await PlayerBadge.insertMany([
      { player: sonia._id, badgeSlug: 'first-session', earnedAt: new Date('2018-09-15') },
      { player: sonia._id, badgeSlug: 'regular-player', earnedAt: new Date('2019-01-10') },
      { player: sonia._id, badgeSlug: 'session-25', earnedAt: new Date('2019-06-01') },
      { player: sonia._id, badgeSlug: 'training-machine', earnedAt: new Date('2020-09-15') },
      { player: sonia._id, badgeSlug: 'hours-10', earnedAt: new Date('2019-04-01') },
      { player: sonia._id, badgeSlug: 'hours-50', earnedAt: new Date('2020-01-01') },
      { player: sonia._id, badgeSlug: 'weekly-streak', earnedAt: new Date('2019-09-01') },
      { player: sonia._id, badgeSlug: 'streak-master', earnedAt: new Date('2020-06-01') },
      { player: sonia._id, badgeSlug: 'tournament-debut', earnedAt: new Date('2020-05-01') },
      { player: sonia._id, badgeSlug: 'winner', earnedAt: new Date('2021-08-15') },
      { player: sonia._id, badgeSlug: 'tournament-5', earnedAt: new Date('2022-04-01') },
      { player: sonia._id, badgeSlug: 'finalist', earnedAt: new Date('2024-10-12') },
      { player: sonia._id, badgeSlug: 'court-traveler', earnedAt: new Date('2021-09-01') },
      { player: sonia._id, badgeSlug: 'goal-achieved', earnedAt: new Date('2021-08-15') },
      { player: sonia._id, badgeSlug: 'three-goals', earnedAt: new Date('2022-12-01') },
      { player: sonia._id, badgeSlug: 'pathway-advance', earnedAt: new Date('2024-09-01') },
      { player: sonia._id, badgeSlug: 'coach-mvp', earnedAt: new Date('2025-08-17'), type: 'manual', awardedBy: headCoach._id, awardedNote: '7. tytuł mistrzowski — niesamowita konsekwencja!' },
      { player: sonia._id, badgeSlug: 'coach-sportsmanship', earnedAt: new Date('2024-12-08'), type: 'manual', awardedBy: headCoach._id, awardedNote: 'Wzór fair play w trudnym finale.' },
    ]);
    console.log('  Sonia: 18 odznak (w tym 2 ręczne)');

    // ============================================================
    // PODSUMOWANIE
    // ============================================================
    const counts = await Promise.all([
      User.countDocuments(),
      Player.countDocuments(),
      Club.countDocuments(),
      Group.countDocuments(),
      Activity.countDocuments(),
      Session.countDocuments(),
      DevelopmentGoal.countDocuments(),
      Observation.countDocuments(),
      ReviewSummary.countDocuments(),
      Recommendation.countDocuments(),
      Tournament.countDocuments(),
      Payment.countDocuments(),
      Message.countDocuments(),
      PlayerBadge.countDocuments(),
      DevelopmentProgram.countDocuments(),
      Achievement.countDocuments(),
    ]);

    console.log('==========================================');
    console.log('Podsumowanie:');
    console.log(`  Użytkownicy:      ${counts[0]} (coach, parent, parent2, admin)`);
    console.log(`  Zawodnicy:        ${counts[1]} (Kacper, Julia, Antoni, Sonia)`);
    console.log(`  Klub:             ${counts[2]}`);
    console.log(`  Grupy:            ${counts[3]}`);
    console.log(`  Aktywnosci:       ${counts[4]}`);
    console.log(`  Sesje (legacy):   ${counts[5]}`);
    console.log(`  Cele rozwojowe:   ${counts[6]}`);
    console.log(`  Obserwacje:       ${counts[7]}`);
    console.log(`  Przeglady:        ${counts[8]}`);
    console.log(`  Rekomendacje:     ${counts[9]}`);
    console.log(`  Turnieje:         ${counts[10]}`);
    console.log(`  Platnosci:        ${counts[11]}`);
    console.log(`  Wiadomosci:       ${counts[12]}`);
    console.log(`  Odznaki:          ${counts[13]}`);
    console.log(`  Programy rozwoju: ${counts[14]}`);
    console.log(`  Osiągnięcia:      ${counts[15]}`);
    console.log('==========================================\n');

    console.log('Konta demo:');
    console.log('  coach@serveiq.pl   / password123  — trener');
    console.log('  parent@serveiq.pl  / password123  — rodzic Kacpra i Antoniego');
    console.log('  parent2@serveiq.pl / password123  — rodzic Julii');
    console.log('  admin@serveiq.pl   / password123  — koordynator klubu\n');

    console.log('Demo Records:');
    console.log('  A) Kacper Nowak  — Tennis 10 Red (beginner)');
    console.log('  B) Julia Kowalska — Junior Advanced (Sonia-light)');
    console.log('  C) Antoni Wisniewski — Tennis 10 Red (nowy)');
    console.log('  D) Sonia Antczak — Performance (Sonia full / stress test)\n');

    console.log('Seed zakonczony pomyslnie! 🎾');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Blad podczas seedowania:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
