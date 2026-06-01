const supabase = require('./config/supabase');

async function fixAdminRole() {
    // Find all users named 'admin' (case insensitive)
    const { data: admins, error: fetchError } = await supabase
        .from('users')
        .select('id, username, role, email')
        .ilike('username', 'admin');

    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }

    console.log('Users named admin:', JSON.stringify(admins, null, 2));

    // Fix any admin-named users that are NOT already set as admin role
    const toFix = admins.filter(u => u.role !== 'admin');
    if (toFix.length > 0) {
        const ids = toFix.map(u => u.id);
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'admin' })
            .in('id', ids);

        if (updateError) {
            console.error('Update error:', updateError);
        } else {
            console.log(`Fixed admin role for ${ids.length} records`);
        }
    } else {
        console.log('All admin-named users already have role=admin');
    }

    console.log('Done.');
}
fixAdminRole().catch(console.error);
