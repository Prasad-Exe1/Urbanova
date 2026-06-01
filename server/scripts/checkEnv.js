/**
 * Validates minimum env vars before starting server.
 * Run: node scripts/checkEnv.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const missing = [];
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!url) missing.push('SUPABASE_URL or VITE_SUPABASE_URL');
if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY');

if (missing.length) {
    console.error('[checkEnv] Missing required variables in server/.env:');
    missing.forEach((v) => console.error('  -', v));
    console.error(
        '\nUse SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API) on the backend for reliable inserts with RLS, or anon key + permissive policies.'
    );
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.warn(
        '[checkEnv] SUPABASE_SERVICE_ROLE_KEY not set — seeds/admin writes may hit RLS. Add server-only secret key.'
    );
}

if (!process.env.JWT_SECRET) {
    console.warn('[checkEnv] JWT_SECRET unset — auth will use insecure default ("secretkey") in development.');
}

if (!process.env.NOMINATIM_CONTACT_EMAIL && !process.env.GOOGLE_MAPS_API_KEY) {
    console.warn(
        '[checkEnv] NOMINATIM_CONTACT_EMAIL unset — set it for respectful Nominatim use (free geocoding).\n'
    );
}

if (!process.env.OPENROUTER_API_KEY?.trim() && !process.env.OPENROUTER_API_KEY_1?.trim() && !process.env.OPENROUTER_API_KEY_2?.trim()) {
    console.warn('[checkEnv] OPENROUTER_API_KEY not set — /api/ai/* will return HTTP 503 until configured.');
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET?.trim()) {
    console.warn(
        '[checkEnv] JWT_SECRET unset while NODE_ENV=production — configure a strong secret before any public deployment.'
    );
}

console.log(
    '[checkEnv] OK.',
    process.env.PORT ? `PORT=${process.env.PORT}` : 'PORT=5000(default)',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? '(service_role)' : '(anon)'
);
process.exit(0);
