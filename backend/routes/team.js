const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Team, TeamMember } = require('../models/Team');
const { User } = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// GET /api/teams/list
router.get('/list', auth, async (req, res) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { user_id: req.user.id, status: 'active' },
      include: [{ model: Team, include: [{ model: TeamMember, as: 'members' }] }],
    });

    const ownedTeams = await Team.findAll({
      where: { owner_id: req.user.id },
      include: [{ model: TeamMember, as: 'members' }],
    });

    const allTeams = [...ownedTeams];
    memberships.forEach(m => {
      if (!allTeams.find(t => t.id === m.Team.id)) allTeams.push(m.Team);
    });

    res.json({ success: true, teams: allTeams });
  } catch (err) {
    console.error('Team list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch teams.' });
  }
});

// POST /api/teams/create
router.post('/create', auth, async (req, res) => {
  try {
    const { team_name, description, max_members } = req.body;
    if (!team_name) return res.status(400).json({ success: false, message: 'Team name required.' });

    const slug = team_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + uuidv4().substring(0, 6);

    const team = await Team.create({
      owner_id: req.user.id, team_name, team_slug: slug,
      description, max_members: max_members || 5,
    });

    await TeamMember.create({
      team_id: team.id, user_id: req.user.id, role: 'owner', status: 'active', joined_at: new Date(),
    });

    res.json({ success: true, team });
  } catch (err) {
    console.error('Team create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create team.' });
  }
});

// POST /api/teams/invite
router.post('/invite', auth, async (req, res) => {
  try {
    const { team_id, email, role } = req.body;

    const team = await Team.findOne({ where: { id: team_id, owner_id: req.user.id } });
    if (!team) return res.status(403).json({ success: false, message: 'Only team owner can invite.' });

    const memberCount = await TeamMember.count({ where: { team_id, status: 'active' } });
    if (memberCount >= team.max_members) {
      return res.status(400).json({ success: false, message: `Max ${team.max_members} members reached.` });
    }

    const invitedUser = await User.findOne({ where: { email } });
    if (!invitedUser) return res.status(404).json({ success: false, message: 'User not found with that email.' });

    const existing = await TeamMember.findOne({ where: { team_id, user_id: invitedUser.id } });
    if (existing && existing.status === 'active') return res.status(400).json({ success: false, message: 'Already a member.' });

    if (existing) {
      await existing.update({ status: 'invited', role: role || 'viewer' });
    } else {
      await TeamMember.create({
        team_id, user_id: invitedUser.id, role: role || 'viewer',
        invited_by: req.user.id, status: 'invited',
      });
    }

    res.json({ success: true, message: `Invited ${email} as ${role || 'viewer'}` });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ success: false, message: 'Invite failed.' });
  }
});

// POST /api/teams/accept/:teamId
router.post('/accept/:teamId', auth, async (req, res) => {
  try {
    const member = await TeamMember.findOne({
      where: { team_id: req.params.teamId, user_id: req.user.id, status: 'invited' },
    });
    if (!member) return res.status(404).json({ success: false, message: 'No pending invite.' });

    await member.update({ status: 'active', joined_at: new Date() });
    res.json({ success: true, message: 'Joined team.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Accept failed.' });
  }
});

// DELETE /api/teams/remove-member
router.delete('/remove-member', auth, async (req, res) => {
  try {
    const { team_id, user_id } = req.body;
    const team = await Team.findOne({ where: { id: team_id, owner_id: req.user.id } });
    if (!team) return res.status(403).json({ success: false, message: 'Only owner can remove members.' });

    await TeamMember.update({ status: 'removed' }, { where: { team_id, user_id } });
    res.json({ success: true, message: 'Member removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Remove failed.' });
  }
});

// DELETE /api/teams/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const team = await Team.findOne({ where: { id: req.params.id, owner_id: req.user.id } });
    if (!team) return res.status(403).json({ success: false, message: 'Only owner can delete team.' });

    await TeamMember.destroy({ where: { team_id: team.id } });
    await team.destroy();
    res.json({ success: true, message: 'Team deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

module.exports = router;
