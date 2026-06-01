const supabase = require('./config/supabase');

async function testConnection() {
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Connection failed:', error);
        process.exit(1);
    }

    console.log('Supabase connected successfully!');
    process.exit(0);
}
testConnection();
