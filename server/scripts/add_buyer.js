/**
 * One-off demo: insert a buyer row via Supabase Management API SQL.
 * Requires a personal access token (never commit): https://supabase.com/dashboard/account/tokens
 *
 * SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_PROJECT_REF=xxxx node server/scripts/add_buyer.js
 */
const https = require('https');

const token = process.env.SUPABASE_ACCESS_TOKEN || '';
const projectRef = process.env.SUPABASE_PROJECT_REF || '';

if (!token || !projectRef) {
  console.error('Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (do not commit).');
  process.exit(1);
}

// Pre-generated bcrypt hash for 'password123'
const hash =
  '$2a$10$P.hl6Pa4kq04BTLVtoxEUufoMnMMNvBgpXVyE30l0aEJzFdLBMG4u';

const sql = `INSERT INTO public.users (username, email, password, role, verification_status) VALUES ('buyer1', 'buyer1@test.com', '${hash}', 'buyer', 'verified') RETURNING id, username, email, role;`;

const body = JSON.stringify({ query: sql });
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${projectRef}/database/query`,
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log('Creating buyer account...');
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      JSON.parse(data);
      console.log('\nBuyer account created!');
      console.log('Username: buyer1');
      console.log('Email: buyer1@test.com');
      console.log('Password: password123');
      console.log('Role: buyer');
      console.log('Status: verified');
    } catch (_) {
      console.log('Response:', data);
    }
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
