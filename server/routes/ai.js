const express = require('express');
const router = express.Router();

const OPENROUTER_KEYS = [
    process.env.OPENROUTER_API_KEY_1?.trim(),
    process.env.OPENROUTER_API_KEY_2?.trim(),
    process.env.OPENROUTER_API_KEY?.trim()
].filter(Boolean);
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

/** Rankings site URL shown to OpenRouter (use your real SPA origin in production). */
function openRouterReferer() {
    return (
        process.env.OPENROUTER_SITE_URL?.trim() ||
        process.env.SITE_ORIGIN?.trim() ||
        process.env.CLIENT_ORIGIN?.trim() ||
        'http://localhost:5173'
    );
}

function openRouterTitle() {
    return process.env.OPENROUTER_SITE_TITLE?.trim() || 'Urbanova Platform';
}

/**
 * Calls OpenRouter with key fallback. Throws if all keys fail.
 */
async function callOpenRouter(messages, temperature = 0.7, format = null) {
    if (OPENROUTER_KEYS.length === 0) {
        const err = new Error('No OpenRouter API keys are configured');
        err.code = 'NO_AI_KEY';
        throw err;
    }

    const payload = {
        model: MODEL,
        temperature,
        messages,
    };

    if (format) payload.response_format = format;

    let lastError = null;

    for (let i = 0; i < OPENROUTER_KEYS.length; i++) {
        const key = OPENROUTER_KEYS[i];
        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': openRouterReferer(),
                    'X-Title': openRouterTitle(),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[AI] OpenRouter Key ${i + 1} Error (HTTP ${response.status}):`, errorText);
                throw new Error(`OpenRouter API responded with status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (err) {
            console.error(`[AI] OpenRouter Key ${i + 1} failed, trying next key... Error:`, err.message || err);
            lastError = err;
        }
    }

    const finalErr = lastError || new Error('All OpenRouter API keys failed.');
    finalErr.code = 'NO_AI_KEY';
    throw finalErr;
}

// POST /api/ai/chat — requires OPENROUTER_KEYS
router.post('/chat', async (req, res) => {
    try {
        if (OPENROUTER_KEYS.length === 0) {
            return res
                .status(503)
                .json({ error: 'AI is not configured — set OPENROUTER_API_KEY_1 / OPENROUTER_API_KEY_2 in server/.env' });
        }

        const query = typeof req.body.query === 'string' ? req.body.query : '';
        if (!query.trim()) {
            return res.status(400).json({ error: 'Missing query in request body.' });
        }

        const propsRaw = req.body.properties;
        const properties = Array.isArray(propsRaw) ? propsRaw : [];

        const propsContext = properties
            .map((p) => {
                const desc =
                    typeof p.description === 'string' && p.description.length > 0
                        ? p.description.substring(0, 120)
                        : '';
                const price = typeof p.price === 'number' ? p.price.toLocaleString() : String(p.price ?? '');
                return `- ${p.title || 'Untitled'} (${p.location || '—'}): ₹${price}${desc ? ` — ${desc}` : ''}`;
            })
            .join('\n');

        const systemPrompt = `You are the "Urbanova AI", focused on the Hyderabad metropolitan real-estate market (GHMC belts, Cyberabad tech corridors, Outer Ring neighbourhoods, Serilingampalle–Shamshabad growth axes, and peri-urban Ranga Reddy / Medchal locales).
Help users compare verified-style listings pulled from Urbanova ("Greater Hyderabad").
If criteria match neighbourhoods (e.g. Banjara Hills, Jubilee, Gachibowli, HITEC City, Miyapur band), cite exact listing titles when possible.
Tone: polite, concise, ₹ Indian pricing intuition. Respond in plain text.

Available listings snapshot:
${propsContext || 'No properties available.'}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
        ];

        const aiResponse = await callOpenRouter(messages, 0.7);
        res.json({ response: aiResponse });
    } catch (err) {
        if (err?.code === 'NO_AI_KEY') {
            return res.status(503).json({ error: 'AI unavailable — OpenRouter keys not set.' });
        }
        console.error('AI Chat Error:', err);
        res.status(500).json({ error: 'Failed to generate AI response' });
    }
});

// POST /api/ai/negotiate
router.post('/negotiate', async (req, res) => {
    try {
        if (OPENROUTER_KEYS.length === 0) {
            return res
                .status(503)
                .json({ error: 'AI is not configured — set OPENROUTER_API_KEY_1 / OPENROUTER_API_KEY_2 in server/.env' });
        }

        const { property, offerPrice } = req.body;
        if (!property || property.price == null || property.title == null) {
            return res.status(400).json({ error: 'Missing or invalid property in request body.' });
        }
        if (offerPrice == null || Number.isNaN(Number(offerPrice))) {
            return res.status(400).json({ error: 'Missing or invalid offerPrice.' });
        }

        const listedPrice = Number(property.price);

        const systemPrompt = `You are an expert real estate negotiation AI.
The user is making an offer of ₹${Number(offerPrice).toLocaleString()} on a property listed at ₹${listedPrice.toLocaleString()}.
The property is "${property.title}" in ${property.location || ''}.
Description: ${property.description || ''}

You must return a raw JSON object (and absolutely nothing else, no markdown formatting) with the following structure:
{
  "probability": <integer between 0 and 100 representing acceptance probability>,
  "strategy": "<a 1-2 sentence strategy advice for the buyer>",
  "counterOffer": <integer representing a realistic counter-offer from the seller, or null if the offer is high enough to be accepted>,
  "script": "<a 2-3 sentence negotiation script the buyer can copy-paste to send to the agent/seller>"
}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analyze my offer.' },
        ];

        const aiResponse = await callOpenRouter(messages, 0.3);
        const cleanJsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResponse = JSON.parse(cleanJsonStr);

        res.json(parsedResponse);
    } catch (err) {
        if (err?.code === 'NO_AI_KEY') {
            return res.status(503).json({ error: 'AI unavailable — OpenRouter keys not set.' });
        }
        console.error('AI Negotiate Error:', err);
        res.status(500).json({ error: 'Failed to analyze offer' });
    }
});

module.exports = router;
