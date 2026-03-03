/**
 * =============================================
 * LISTING AI OPTIMIZER SERVICE
 * =============================================
 * Claude API se Amazon product listing optimize
 * karta hai - title, bullets, description aur
 * backend keywords har country ke hisab se.
 * Optimized for Amazon A10 Algorithm.
 * =============================================
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

class ListingOptimizer {
  /**
   * Optimize a product listing using Claude AI
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

    const marketplace = countryConfig.marketplace || 'amazon.com';
    const currencySymbol = countryConfig.currencySymbol || '$';

    // Detect input language from user's actual text, NOT country
    const inputText = `${title} ${description} ${bullets.join(' ')}`;
    const detectedLanguage = this.detectLanguage(inputText);

    const prompt = this.buildPrompt({
      title,
      description,
      bullets,
      keywords,
      category,
      countryCode,
      language: detectedLanguage,
      marketplace,
      currencySymbol,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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
      aiModel: 'claude-sonnet-4-20250514',
      language: detectedLanguage,
      marketplace,
    };
  }

  /**
   * Detect language from input text
   * If input is English → output in English
   * If input is Hindi → output in Hindi
   * etc.
   */
  static detectLanguage(text) {
    if (!text || text.trim().length === 0) return 'en';

    // Check for Hindi (Devanagari script)
    const hindiPattern = /[\u0900-\u097F]/;
    if (hindiPattern.test(text)) return 'hi';

    // Check for Arabic script
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(text)) return 'ar';

    // Check for Japanese
    const japanesePattern = /[\u3040-\u30FF\u4E00-\u9FFF]/;
    if (japanesePattern.test(text)) return 'ja';

    // Check for Chinese
    const chinesePattern = /[\u4E00-\u9FFF]/;
    if (chinesePattern.test(text)) return 'zh';

    // Check for Spanish/Portuguese/French common patterns
    const spanishPattern = /[ñáéíóúü¿¡]/i;
    if (spanishPattern.test(text)) return 'es';

    const frenchPattern = /[àâçéèêëïîôùûüÿœæ]/i;
    if (frenchPattern.test(text)) return 'fr';

    const germanPattern = /[äöüßÄÖÜ]/;
    if (germanPattern.test(text)) return 'de';

    // Default: English
    return 'en';
  }

  static buildPrompt({ title, description, bullets, keywords, category, countryCode, language, marketplace, currencySymbol }) {
    const bulletsText = bullets.map((b, i) => `${i + 1}. ${b}`).join('\n');
    const keywordsText = keywords.join(', ');

    const languageMap = {
      en: 'English',
      hi: 'Hindi',
      ar: 'Arabic',
      ja: 'Japanese',
      zh: 'Chinese',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      pt: 'Portuguese',
      it: 'Italian',
    };

    const languageName = languageMap[language] || 'English';

    return `You are an expert Amazon listing copywriter optimized for Amazon's A10 algorithm for the ${marketplace} marketplace (${countryCode}).

CRITICAL LANGUAGE RULE: The user's input is in ${languageName}. You MUST write ALL output in ${languageName}. Match the SAME language as the input text. If input is in English, output MUST be in English. Do NOT translate to any other language.

Optimize this Amazon product listing for maximum conversion, SEO, and Amazon A10 algorithm ranking:

ORIGINAL TITLE: ${title || 'Not provided'}
ORIGINAL DESCRIPTION: ${description || 'Not provided'}
ORIGINAL BULLETS:
${bulletsText || 'Not provided'}
CATEGORY: ${category}
TARGET KEYWORDS: ${keywordsText || 'None specified'}
MARKETPLACE: ${marketplace} (${countryCode})

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

Amazon A10 Algorithm Optimization Rules:
- Title: Place primary keyword at the very start, include 2-3 secondary keywords naturally, keep under 200 characters
- Title: Use format: [Primary Keyword] - [Brand/Product] [Key Feature] | [Secondary Keywords] | [Benefit]
- Bullets: Start each with ALL-CAPS benefit label, be specific with numbers/features/dimensions
- Bullets: Include long-tail keywords naturally in each bullet point
- Description: Tell a compelling story, address customer pain points, include keywords naturally
- Description: Use short paragraphs, focus on benefits over features
- Backend keywords: 5-10 relevant search terms NOT already in title/bullets (no duplicates)
- Backend keywords: Include common misspellings, synonyms, and related terms
- Do NOT include: prices (${currencySymbol}), promotions, subjective claims ("best", "#1"), competitor names, HTML tags
- Focus on: Sales velocity signals, relevance matching, customer engagement triggers
- REMEMBER: Output language MUST match input language (${languageName})`;
  }

  static parseResponse(text) {
    const result = { title: '', description: '', bullets: [], backendKeywords: [] };
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        result.title = parsed.title || '';
        result.description = parsed.description || '';
        result.bullets = Array.isArray(parsed.bullets) ? parsed.bullets : [];
        result.backendKeywords = Array.isArray(parsed.backendKeywords) ? parsed.backendKeywords : [];
      }
    } catch {
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
