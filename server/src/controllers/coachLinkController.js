import User from '../models/User.js';
import Player from '../models/Player.js';
import CoachRequest from '../models/CoachRequest.js';
import Notification from '../models/Notification.js';

// ── Coach: get own invite code ─────────────────────────
export const getMyCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Lazy generate for existing coaches without code
    if (!user.coachProfile?.inviteCode) {
      if (!user.coachProfile) user.coachProfile = {};
      await user.save(); // pre-save hook generates the code
    }

    res.json({
      inviteCode: user.coachProfile.inviteCode,
      inviteActive: user.coachProfile.inviteActive ?? true,
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// ── Coach: reset invite code ───────────────────────────
export const resetCode = async (req, res) => {
  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let exists = true;
    while (exists) {
      code = '';
      for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      exists = await User.findOne({ 'coachProfile.inviteCode': code });
    }

    await User.findByIdAndUpdate(req.user._id, {
      'coachProfile.inviteCode': code,
    });

    res.json({ inviteCode: code });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// ── Coach: toggle code active/inactive ─────────────────
export const toggleCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const newState = !user.coachProfile?.inviteActive;
    if (!user.coachProfile) user.coachProfile = {};
    user.coachProfile.inviteActive = newState;
    await user.save();

    res.json({ inviteActive: newState });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// ── Parent: validate code (preview coach) ──────────────
export const validateCode = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || code.length < 4) {
      return res.status(400).json({ error: 'Nieprawidłowy kod' });
    }

    const coach = await User.findOne({
      role: 'coach',
      'coachProfile.inviteCode': code.toUpperCase().trim(),
      'coachProfile.inviteActive': true,
    }).select('firstName lastName coachProfile.specialization coachProfile.itfLevel coachProfile.bio');

    if (!coach) {
      return res.status(404).json({ error: 'Nieprawidłowy kod zaproszenia' });
    }

    res.json({
      coach: {
        _id: coach._id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        specialization: coach.coachProfile?.specialization,
        itfLevel: coach.coachProfile?.itfLevel,
        bio: coach.coachProfile?.bio,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// ── Parent: submit join request ───────────��────────────
export const joinCoach = async (req, res) => {
  try {
    const { code, playerIds, message } = req.body;

    if (!code || !playerIds?.length) {
      return res.status(400).json({ error: 'Kod i lista graczy są wymagane' });
    }

    // Find coach by code
    const coach = await User.findOne({
      role: 'coach',
      'coachProfile.inviteCode': code.toUpperCase().trim(),
      'coachProfile.inviteActive': true,
    });

    if (!coach) {
      return res.status(404).json({ error: 'Nieprawidłowy kod zaproszenia' });
    }

    // Verify players belong to this parent
    const parentChildren = req.user.parentProfile?.children || [];
    const childIds = parentChildren.map((c) => c.toString());
    const validPlayerIds = playerIds.filter((id) => childIds.includes(id));

    if (!validPlayerIds.length) {
      return res.status(400).json({ error: 'Brak prawidłowych graczy' });
    }

    // Check for existing pending request
    const existing = await CoachRequest.findOne({
      parent: req.user._id,
      coach: coach._id,
      status: 'pending',
    });

    if (existing) {
      return res.status(409).json({ error: 'Masz już oczekującą prośbę do tego trenera' });
    }

    // Check which players already have this coach
    const players = await Player.find({
      _id: { $in: validPlayerIds },
      parents: req.user._id,
    });

    const alreadyLinked = players.filter((p) =>
      p.coaches?.some((c) => c.toString() === coach._id.toString())
    );

    if (alreadyLinked.length === players.length) {
      return res.status(409).json({ error: 'Wszystkie wybrane dzieci są już połączone z tym trenerem' });
    }

    const newPlayerIds = players
      .filter((p) => !p.coaches?.some((c) => c.toString() === coach._id.toString()))
      .map((p) => p._id);

    const request = await CoachRequest.create({
      parent: req.user._id,
      coach: coach._id,
      players: newPlayerIds,
      status: 'pending',
      message: message?.slice(0, 500) || '',
    });

    // Notify coach
    const playerNames = players
      .filter((p) => newPlayerIds.some((id) => id.toString() === p._id.toString()))
      .map((p) => `${p.firstName} ${p.lastName}`)
      .join(', ');

    await Notification.create({
      user: coach._id,
      type: 'coach_request_new',
      title: 'Nowa prośba o dołączenie',
      body: `${req.user.firstName} ${req.user.lastName} chce dołączyć: ${playerNames}`,
      severity: 'info',
      metadata: { requestId: request._id },
    });

    res.status(201).json({
      message: 'Prośba wysłana do trenera',
      request: {
        _id: request._id,
        coach: { firstName: coach.firstName, lastName: coach.lastName },
        status: 'pending',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// ─�� Coach/Parent: list requests ──────────���─────────────
export const getRequests = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'coach') {
      query.coach = req.user._id;
      query.status = req.query.status || 'pending';
    } else {
      query.parent = req.user._id;
    }

    const requests = await CoachRequest.find(query)
      .populate('parent', 'firstName lastName email phone')
      .populate('coach', 'firstName lastName coachProfile')
      .populate('players', 'firstName lastName dateOfBirth')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};

// ── Coach: accept or reject request ────────────────────
export const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status musi być accepted lub rejected' });
    }

    const request = await CoachRequest.findOne({
      _id: req.params.id,
      coach: req.user._id,
      status: 'pending',
    });

    if (!request) {
      return res.status(404).json({ error: 'Nie znaleziono prośby' });
    }

    request.status = status;
    await request.save();

    if (status === 'accepted') {
      // Add coach to each player's coaches array
      await Player.updateMany(
        { _id: { $in: request.players } },
        { $addToSet: { coaches: req.user._id } }
      );

      // Also set primary coach if player doesn't have one
      await Player.updateMany(
        { _id: { $in: request.players }, coach: null },
        { $set: { coach: req.user._id } }
      );
    }

    // Notify parent
    const statusText = status === 'accepted' ? 'zaakceptował' : 'odrzucił';
    await Notification.create({
      user: request.parent,
      type: 'coach_request_response',
      title: status === 'accepted' ? 'Prośba zaakceptowana!' : 'Prośba odrzucona',
      body: `Trener ${req.user.firstName} ${req.user.lastName} ${statusText} Twoją prośbę`,
      severity: status === 'accepted' ? 'info' : 'warning',
      metadata: { requestId: request._id },
    });

    res.json({ message: `Prośba ${statusText}`, request });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
};
