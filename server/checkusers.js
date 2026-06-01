const supabase = require('./config/supabase');

async function check() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('username', ['buyer1', 'seller1', 'agent1']);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found users:', JSON.stringify(users, null, 2));
}
check();
