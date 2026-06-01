const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function fix() {
    // Delete old test users
    const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .in('username', ['buyer1', 'seller1', 'agent1']);

    if (deleteError) {
        console.error('Delete error:', deleteError);
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    console.log('Hash:', hash);

    const { error: insertError } = await supabase.from('users').insert([
        { username: 'buyer1', email: 'buyer1@test.com', password: hash, role: 'buyer' },
        { username: 'seller1', email: 'seller1@test.com', password: hash, role: 'seller' },
        { username: 'agent1', email: 'agent1@test.com', password: hash, role: 'agent' }
    ]);

    if (insertError) {
        console.error('Insert error:', insertError);
    } else {
        console.log('Created fresh users');
    }
}
fix();
