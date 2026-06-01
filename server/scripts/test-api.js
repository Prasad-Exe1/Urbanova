/**
 * Smoke-test OpenRouter chat completions from the CLI.
 * Usage (repo root): OPENROUTER_API_KEY=sk-or-v1-... node server/scripts/test-api.js
 */
const https = require('https');

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_1 || process.env.OPENROUTER_API_KEY_2 || '';
if (!apiKey) {
  console.error('Set OPENROUTER_API_KEY, OPENROUTER_API_KEY_1, or OPENROUTER_API_KEY_2 (do not commit keys).');
  process.exit(1);
}

const data = JSON.stringify({
  model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
  messages: [{ role: 'user', content: "Say 'Hello World' if you receive this message." }],
});

const referer =
  process.env.OPENROUTER_SITE_URL ||
  process.env.SITE_ORIGIN ||
  process.env.CLIENT_ORIGIN ||
  'http://localhost:5173';

const options = {
  hostname: 'openrouter.ai',
  port: 443,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': referer,
    'X-Title': process.env.OPENROUTER_SITE_TITLE || 'Urbanova CLI test',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    } catch (_) {
      console.log(responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
