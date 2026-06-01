const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

const USERNAME = 'admin';
const EMAIL = 'admin@urbanova.com';
const DEFAULT_PASSWORD = 'admin123';

async function createAdmin() {
    const forceReset =
        process.argv.includes('--force') || process.env.CREATE_ADMIN_FORCE === '1';

    try {
        const usingServiceRole = !!(
            process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
        );
        if (!usingServiceRole) {
            console.warn(
                '[createAdmin] SUPABASE_SERVICE_ROLE_KEY is not set; using anon/publishable key. ' +
                    'If inserts or selects fail, set the service role key in server/.env or apply permissive dev RLS (see sql/supabase_rls_anon_dev.sql).'
            );
        }

        const { data: existingAdmin, error: lookupErr } = await supabase
            .from('users')
            .select('id')
            .eq('username', USERNAME)
            .maybeSingle();

        if (lookupErr) {
            console.error('[createAdmin] Could not look up users table:', lookupErr.message || lookupErr);
            process.exitCode = 1;
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

        if (existingAdmin) {
            if (forceReset) {
                const { error: updErr } = await supabase
                    .from('users')
                    .update({ password: hashedPassword, role: 'admin', email: EMAIL })
                    .eq('username', USERNAME);
                if (updErr) throw updErr;
                console.log(
                    `[createAdmin] Password reset for "${USERNAME}" (${DEFAULT_PASSWORD}). Role/email refreshed.`
                );
            } else {
                console.log(`Admin user already exists. Username: ${USERNAME}`);
                console.log(`Use --force or CREATE_ADMIN_FORCE=1 to reset password to ${DEFAULT_PASSWORD}.`);
            }
            return;
        }

        const { data: inserted, error: insertErr } = await supabase
            .from('users')
            .insert([
                {
                    username: USERNAME,
                    email: EMAIL,
                    password: hashedPassword,
                    role: 'admin',
                },
            ])
            .select('id')
            .maybeSingle();

        if (insertErr) throw insertErr;

        console.log(`Admin created successfully. Username: ${USERNAME} / password: ${DEFAULT_PASSWORD}`);
        if (inserted?.id) console.log(`User id: ${inserted.id}`);
    } catch (err) {
        console.error('[createAdmin] Failed:', err.message || err);
        if (err.code || err.details) console.error(err);
        process.exitCode = 1;
    }
}

createAdmin();
