const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function testLogin() {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'admin')
        .single();

    if (error || !user) {
        console.log('ERROR: No user with username "admin" found!');
        const { data: allUsers } = await supabase.from('users').select('username, role');
        console.log('All users:', allUsers);
        return;
    }

    console.log('Found user:', { username: user.username, role: user.role, email: user.email });
    console.log('Password hash:', user.password);

    // Test password "admin"
    const valid1 = await bcrypt.compare('admin', user.password);
    console.log('Password "admin" matches:', valid1);

    // Test password "admin123" (from createAdmin.js)
    const valid2 = await bcrypt.compare('admin123', user.password);
    console.log('Password "admin123" matches:', valid2);

    console.log('Done.');
}
testLogin().catch(console.error);
