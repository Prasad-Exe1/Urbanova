const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

async function createTestUsers() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
        { username: 'buyer1', email: 'buyer1@test.com', password: hashedPassword, role: 'buyer' },
        { username: 'seller1', email: 'seller1@test.com', password: hashedPassword, role: 'seller' },
        { username: 'agent1', email: 'agent1@test.com', password: hashedPassword, role: 'agent' }
    ];

    for (const userData of users) {
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', userData.username)
            .single();

        if (!existing) {
            const { error } = await supabase.from('users').insert([userData]);
            if (error) {
                console.error(`Error creating ${userData.username}:`, error);
            } else {
                console.log(`Created ${userData.role}: ${userData.username} / password123`);
            }
        } else {
            console.log(`${userData.username} already exists`);
        }
    }

    console.log('\nTest Users (all use password: password123):');
    console.log('1. Buyer: buyer1 / password123');
    console.log('2. Seller: seller1 / password123');
    console.log('3. Agent: agent1 / password123');
}

createTestUsers();
