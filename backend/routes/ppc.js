const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { PPCCampaign, PPCKeyword } = require('../models/PPC');
const { Op } = require('sequelize');

// Helper: recalculate campaign metrics from keywords
async function recalcCampaign(campaignId) {
  const kws = await PPCKeyword.findAll({ where: { campaign_id: campaignId, status: { [Op.ne]: 'negative' } }, raw: true });
  const totals = kws.reduce((acc, k) => ({
    spend: acc.spend + (k.spend || 0),
    sales: acc.sales + (k.sales || 0),
    impressions: acc.impressions + (k.impressions || 0),
    clicks: acc.clicks + (k.clicks || 0),
    orders: acc.orders + (k.orders || 0),
  }), { spend: 0, sales: 0, impressions: 0, clicks: 0, orders: 0 });

  const acos = totals.sales > 0 ? Math.round((totals.spend / totals.sales) * 10000) / 100 : 0;
  const roas = totals.spend > 0 ? Math.round((totals.sales / totals.spend) * 100) / 100 : 0;

  await PPCCampaign.update({
    total_spend: Math.round(totals.spend * 100) / 100,
    total_sales: Math.round(totals.sales * 100) / 100,
    total_impressions: totals.impressions,
    total_clicks: totals.clicks,
    total_orders: totals.orders,
    acos, roas,
  }, { where: { id: campaignId } });
}

// GET /api/ppc/campaigns
router.get('/campaigns', auth, async (req, res) => {
  try {
    const campaigns = await PPCCampaign.findAll({
      where: { user_id: req.user.id },
      include: [{ model: PPCKeyword, as: 'keywords' }],
      order: [['created_at', 'DESC']],
    });

    const totalSpend = campaigns.reduce((s, c) => s + (c.total_spend || 0), 0);
    const totalSales = campaigns.reduce((s, c) => s + (c.total_sales || 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks || 0), 0);
    const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions || 0), 0);
    const totalOrders = campaigns.reduce((s, c) => s + (c.total_orders || 0), 0);
    const overallAcos = totalSales > 0 ? Math.round((totalSpend / totalSales) * 10000) / 100 : 0;
    const overallRoas = totalSpend > 0 ? Math.round((totalSales / totalSpend) * 100) / 100 : 0;

    res.json({
      success: true, campaigns,
      summary: { totalCampaigns: campaigns.length, totalSpend: Math.round(totalSpend * 100) / 100, totalSales: Math.round(totalSales * 100) / 100, totalClicks, totalImpressions, totalOrders, overallAcos, overallRoas },
    });
  } catch (err) {
    console.error('PPC list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch campaigns.' });
  }
});

// POST /api/ppc/campaigns
router.post('/campaigns', auth, async (req, res) => {
  try {
    const campaign = await PPCCampaign.create({ ...req.body, user_id: req.user.id });
    res.json({ success: true, campaign });
  } catch (err) {
    console.error('PPC create error:', err);
    res.status(500).json({ success: false, message: 'Failed to create campaign.' });
  }
});

// PUT /api/ppc/campaigns/:id
router.put('/campaigns/:id', auth, async (req, res) => {
  try {
    const campaign = await PPCCampaign.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });
    await campaign.update(req.body);
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// DELETE /api/ppc/campaigns/:id
router.delete('/campaigns/:id', auth, async (req, res) => {
  try {
    await PPCKeyword.destroy({ where: { campaign_id: req.params.id, user_id: req.user.id } });
    await PPCCampaign.destroy({ where: { id: req.params.id, user_id: req.user.id } });
    res.json({ success: true, message: 'Campaign deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

// POST /api/ppc/keywords
router.post('/keywords', auth, async (req, res) => {
  try {
    const { campaign_id, keywords } = req.body;
    const campaign = await PPCCampaign.findOne({ where: { id: campaign_id, user_id: req.user.id } });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const created = [];
    const kwList = Array.isArray(keywords) ? keywords : [req.body];
    for (const kw of kwList) {
      const k = await PPCKeyword.create({
        campaign_id, user_id: req.user.id,
        keyword: kw.keyword, match_type: kw.match_type || 'exact',
        bid: parseFloat(kw.bid) || 0, status: kw.status || 'active',
        impressions: parseInt(kw.impressions) || 0, clicks: parseInt(kw.clicks) || 0,
        spend: parseFloat(kw.spend) || 0, sales: parseFloat(kw.sales) || 0,
        orders: parseInt(kw.orders) || 0,
      });
      // Auto-calc keyword metrics
      const cpc = k.clicks > 0 ? Math.round((k.spend / k.clicks) * 100) / 100 : 0;
      const ctr = k.impressions > 0 ? Math.round((k.clicks / k.impressions) * 10000) / 100 : 0;
      const acos = k.sales > 0 ? Math.round((k.spend / k.sales) * 10000) / 100 : 0;
      const conversion_rate = k.clicks > 0 ? Math.round((k.orders / k.clicks) * 10000) / 100 : 0;
      await k.update({ cpc, ctr, acos, conversion_rate });
      created.push(k);
    }

    await recalcCampaign(campaign_id);
    res.json({ success: true, keywords: created });
  } catch (err) {
    console.error('PPC keyword error:', err);
    res.status(500).json({ success: false, message: 'Failed to add keywords.' });
  }
});

// PUT /api/ppc/keywords/:id
router.put('/keywords/:id', auth, async (req, res) => {
  try {
    const kw = await PPCKeyword.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!kw) return res.status(404).json({ success: false, message: 'Keyword not found.' });
    await kw.update(req.body);
    // Recalc
    const cpc = kw.clicks > 0 ? Math.round((kw.spend / kw.clicks) * 100) / 100 : 0;
    const ctr = kw.impressions > 0 ? Math.round((kw.clicks / kw.impressions) * 10000) / 100 : 0;
    const acos = kw.sales > 0 ? Math.round((kw.spend / kw.sales) * 10000) / 100 : 0;
    const conversion_rate = kw.clicks > 0 ? Math.round((kw.orders / kw.clicks) * 10000) / 100 : 0;
    await kw.update({ cpc, ctr, acos, conversion_rate });
    await recalcCampaign(kw.campaign_id);
    res.json({ success: true, keyword: kw });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed.' });
  }
});

// DELETE /api/ppc/keywords/:id
router.delete('/keywords/:id', auth, async (req, res) => {
  try {
    const kw = await PPCKeyword.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!kw) return res.status(404).json({ success: false, message: 'Keyword not found.' });
    const campId = kw.campaign_id;
    await kw.destroy();
    await recalcCampaign(campId);
    res.json({ success: true, message: 'Keyword deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed.' });
  }
});

// GET /api/ppc/optimizer/:campaignId — AI suggestions
router.get('/optimizer/:campaignId', auth, async (req, res) => {
  try {
    const campaign = await PPCCampaign.findOne({
      where: { id: req.params.campaignId, user_id: req.user.id },
      include: [{ model: PPCKeyword, as: 'keywords' }],
    });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found.' });

    const suggestions = [];
    const kws = campaign.keywords || [];

    // High ACoS keywords — reduce bid or pause
    kws.filter(k => k.acos > 50 && k.spend > 5).forEach(k => {
      suggestions.push({
        type: 'reduce_bid', priority: 'high', icon: '📉',
        keyword: k.keyword, matchType: k.match_type,
        message: `ACoS ${k.acos}% is too high. Reduce bid from $${k.bid} to $${Math.max(0.1, k.bid * 0.7).toFixed(2)} or pause.`,
        currentBid: k.bid, suggestedBid: Math.round(Math.max(0.1, k.bid * 0.7) * 100) / 100,
      });
    });

    // Zero sales but spending
    kws.filter(k => k.sales === 0 && k.spend > 3 && k.clicks > 5).forEach(k => {
      suggestions.push({
        type: 'pause', priority: 'high', icon: '⏸️',
        keyword: k.keyword, matchType: k.match_type,
        message: `$${k.spend} spent, ${k.clicks} clicks, 0 sales. Consider pausing or adding as negative.`,
      });
    });

    // Low CTR
    kws.filter(k => k.impressions > 500 && k.ctr < 0.2).forEach(k => {
      suggestions.push({
        type: 'improve_listing', priority: 'medium', icon: '📝',
        keyword: k.keyword, matchType: k.match_type,
        message: `CTR is only ${k.ctr}%. Improve main image or title for "${k.keyword}".`,
      });
    });

    // High converters — increase bid
    kws.filter(k => k.acos > 0 && k.acos < 20 && k.orders > 2).forEach(k => {
      suggestions.push({
        type: 'increase_bid', priority: 'medium', icon: '📈',
        keyword: k.keyword, matchType: k.match_type,
        message: `Great performer: ${k.acos}% ACoS, ${k.orders} orders. Increase bid from $${k.bid} to $${(k.bid * 1.3).toFixed(2)} for more visibility.`,
        currentBid: k.bid, suggestedBid: Math.round(k.bid * 1.3 * 100) / 100,
      });
    });

    // Budget suggestion
    if (campaign.total_spend > 0 && campaign.acos > 35) {
      suggestions.push({
        type: 'budget', priority: 'medium', icon: '💰',
        message: `Overall ACoS is ${campaign.acos}%. Consider reducing daily budget from $${campaign.daily_budget} to $${Math.round(campaign.daily_budget * 0.8)}.`,
      });
    }

    if (campaign.roas > 3) {
      suggestions.push({
        type: 'scale', priority: 'low', icon: '🚀',
        message: `ROAS is ${campaign.roas}x. Campaign is profitable — consider increasing budget by 20-30%.`,
      });
    }

    res.json({ success: true, campaign: campaign.campaign_name, suggestions: suggestions.sort((a, b) => a.priority === 'high' ? -1 : 1) });
  } catch (err) {
    console.error('PPC optimizer error:', err);
    res.status(500).json({ success: false, message: 'Optimization failed.' });
  }
});

module.exports = router;
