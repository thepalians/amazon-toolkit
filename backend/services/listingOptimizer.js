/**
 * =============================================
 * LISTING AI OPTIMIZER SERVICE
 * =============================================
 * Claude API se Amazon product listing optimize
 * karta hai - title, bullets, description aur
 * backend keywords har country ke hisab se.
 * =============================================
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

class ListingOptimizer {
  /**
   * Optimize a product listing using Claude AI
   * @param {Object} params
   * @param {string} params.title - Original product title
   * @param {string} params.description - Original description
   * @param {string[]} params.bullets - Original bullet points
   * @param {string[]} params.keywords - Target keywords to include
   * @param {string} params.category - Product category
   * @param {string} params.countryCode - Country code
   * @param {Object} params.countryConfig - Country config (language, marketplace)
   */
  static async optimize(params) {
    const {
      title = '',
      description = '',
      bullets = [],
      keywords = [],
      category = 'general',
      countryCode = 'US',
      countryConfig = {},
    } = params;

    const language = countryConfig.language || 'en';
    const marketplace = countryConfig.marketplace || 'amazon.com';
    const currencySymbol = countryConfig.currencySymbol || '$';

    const prompt = this.buildPrompt({
      title,
      description,
      bullets,
      keywords,
      category,
      countryCode,
      language,
      marketplace,
      currencySymbol,
    });

    const message = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = message.content[0]?.text || '';
    const parsed = this.parseResponse(rawText);
    const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

    return {
      success: true,
      optimizedTitle: parsed.title || title,
      optimizedDescription: parsed.description || description,
      optimizedBullets: parsed.bullets.length ? parsed.bullets : bullets,
      backendKeywords: parsed.backendKeywords || [],
      optimizationScore: this.scoreOptimization(parsed),
      tokensUsed,
      aiModel: 'claude-3-5-haiku-20241022',
      language,
      marketplace,
    };
  }

  static buildPrompt({ title, description, bullets, keywords, category, countryCode, language, marketplace, currencySymbol }) {
    const bulletsText = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
    const keywordsText = keywords.join(', ');

    const languageInstruction = language !== 'en'
      ? `IMPORTANT: Write all output in the local language for ${countryCode} (language code: ${language}), as this is for the ${marketplace} marketplace.`
      : `Write all output in English for the ${marketplace} marketplace.`;

    return `You are an expert Amazon listing copywriter for the ${marketplace} marketplace (${countryCode}).

${languageInstruction}

Optimize this Amazon product listing for maximum conversion and SEO:

ORIGINAL TITLE: ${title || 'Not provided'}
ORIGINAL DESCRIPTION: ${description || 'Not provided'}
ORIGINAL BULLETS:
${bulletsText || 'Not provided'}
CATEGORY: ${category}
TARGET KEYWORDS: ${keywordsText || 'None specified'}

Please provide an optimized listing in this EXACT JSON format (no markdown, pure JSON):
{
  "title": "Optimized title here (max 200 chars, include top keywords naturally)",
  "description": "Optimized description here (150-300 words, engaging, benefit-focused)",
  "bullets": [
    "BENEFIT 1: First bullet point here",
    "BENEFIT 2: Second bullet point here",
    "BENEFIT 3: Third bullet point here",
    "BENEFIT 4: Fourth bullet point here",
    "BENEFIT 5: Fifth bullet point here"
  ],
  "backendKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- Title: Include primary keyword at start, keep under 200 characters
- Bullets: Start with ALL-CAPS benefit label, be specific with numbers/features
- Description: Tell a story, address customer pain points, include keywords naturally
- Backend keywords: 5-10 relevant search terms not already in title/bullets
- Do NOT include: prices, promotions, subjective claims, competitor names`;
  }

  static parseResponse(text) {
    const result = { title: '', description: '', bullets: [], backendKeywords: [] };
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result.title = parsed.title || '';
        result.description = parsed.description || '';
        result.bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
        result.backendKeywords = Array.isArray(parsed.backendKeywords) ? parsed.backendKeywords : [];
      }
    } catch {
      // If JSON parse fails, try regex extraction
      const titleMatch = text.match(/"title":\s*"([^"]+)"/);
      if (titleMatch) result.title = titleMatch[1];
    }
    return result;
  }

  static scoreOptimization(parsed) {
    let score = 0;
    if (parsed.title && parsed.title.length >= 50) score += 25;
    if (parsed.description && parsed.description.length >= 100) score += 25;
    if (parsed.bullets && parsed.bullets.length >= 5) score += 25;
    if (parsed.backendKeywords && parsed.backendKeywords.length >= 3) score += 25;
    return score;
  }
}

module.exports = ListingOptimizer;
