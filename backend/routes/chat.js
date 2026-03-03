const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { ChatSession, ChatMessage } = require('../models/Chat');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert Amazon Seller AI Assistant built into the Amazon Seller Toolkit by Palians. You help Amazon sellers with:

1. **Product Research** — Finding profitable products, analyzing competition, niche selection
2. **Listing Optimization** — Writing titles, bullet points, descriptions, backend keywords
3. **PPC Advertising** — Campaign strategy, keyword bidding, ACoS optimization
4. **Pricing Strategy** — Competitive pricing, repricing tactics, profit margins
5. **Inventory Management** — Stock forecasting, reorder timing, FBA vs FBM
6. **Review Management** — Getting reviews, handling negative feedback
7. **Keyword Research** — Finding high-volume keywords, long-tail strategies
8. **FBA Fees** — Understanding referral fees, fulfillment fees, storage fees
9. **Account Health** — Policy compliance, avoiding suspensions
10. **Scaling** — Growing from beginner to advanced seller

Rules:
- Be specific and actionable with advice
- Include numbers, percentages, and examples when possible
- If asked about a specific ASIN, help analyze it
- Suggest using tools in the toolkit when relevant (Profit Calculator, Keyword Research, Listing Score, etc.)
- Format responses with clear headings and bullet points
- Keep responses concise but comprehensive
- Support all 9 Amazon marketplaces: US, IN, UK, AE, DE, FR, CA, AU, JP`;

// GET /api/chat/sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.findAll({
      where: { user_id: req.user.id },
      order: [['updated_at', 'DESC']],
      limit: 50,
    });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
});

// POST /api/chat/sessions — create new session
router.post('/sessions', auth, async (req, res) => {
  try {
    const session = await ChatSession.create({
      user_id: req.user.id,
      session_title: req.body.title || 'New Chat',
    });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create session.' });
  }
});

// GET /api/chat/messages/:sessionId
router.get('/messages/:sessionId', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      where: { id: req.params.sessionId, user_id: req.user.id },
    });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    const messages = await ChatMessage.findAll({
      where: { session_id: session.id },
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// POST /api/chat/send — send message and get AI response
router.post('/send', auth, async (req, res) => {
  try {
    const { session_id, message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required.' });

    let session;
    if (session_id) {
      session = await ChatSession.findOne({ where: { id: session_id, user_id: req.user.id } });
    }

    if (!session) {
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      session = await ChatSession.create({ user_id: req.user.id, session_title: title });
    }

    // Save user message
    await ChatMessage.create({
      session_id: session.id, user_id: req.user.id, role: 'user', content: message,
    });

    // Get conversation history (last 20 messages for context)
    const history = await ChatMessage.findAll({
      where: { session_id: session.id },
      order: [['created_at', 'ASC']],
      limit: 20,
    });

    const messages = history.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    }));

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages,
    });

    const aiContent = response.content[0]?.text || 'Sorry, I could not generate a response.';
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    // Save AI response
    await ChatMessage.create({
      session_id: session.id, user_id: req.user.id,
      role: 'assistant', content: aiContent, tokens_used: tokensUsed,
    });

    // Update session
    await session.update({
      total_messages: session.total_messages + 2,
      updated_at: new Date(),
    });

    res.json({
      success: true,
      session_id: session.id,
      response: aiContent,
      tokens_used: tokensUsed,
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ success: false, message: 'AI response failed: ' + (err.message || 'Unknown error') });
  }
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    await ChatMessage.destroy({ where: { session_id: req.params.id, user_id: req.user.id } });
    await ChatSession.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

// Quick templates
router.get('/templates', auth, async (req, res) => {
  const templates = [
    { icon: '🔍', title: 'Product Research', prompt: 'Help me find a profitable product to sell on Amazon US. My budget is $5000 and I want at least 30% profit margin.' },
    { icon: '✍️', title: 'Optimize My Listing', prompt: 'I need help optimizing my Amazon listing. My ASIN is [YOUR_ASIN]. Please help me write a better title, bullets, and description.' },
    { icon: '🎯', title: 'PPC Strategy', prompt: 'I am spending $50/day on PPC with 35% ACoS. My target ACoS is 25%. How should I optimize my campaigns?' },
    { icon: '💰', title: 'Pricing Strategy', prompt: 'My product costs $8 to source, FBA fee is $5.50, and competitors sell between $24-29. What should my price be?' },
    { icon: '📦', title: 'Inventory Planning', prompt: 'I sell 15 units/day with 21 days lead time from supplier. How much safety stock should I keep? When should I reorder?' },
    { icon: '⭐', title: 'Review Strategy', prompt: 'My product has 45 reviews with 4.2 stars. Competitors have 500+ reviews. How can I get more reviews legitimately?' },
    { icon: '🚀', title: 'Launch Strategy', prompt: 'I am launching a new product on Amazon. What is the best launch strategy to rank quickly and get initial sales?' },
    { icon: '📊', title: 'Analyze Competition', prompt: 'Help me analyze the competition in [YOUR_NICHE] on Amazon. What should I look for and how to find gaps?' },
  ];
  res.json({ success: true, templates });
});

module.exports = router;
