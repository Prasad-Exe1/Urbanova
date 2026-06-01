const supabase = require('./config/supabase');

async function seedProperties() {
    try {
        console.log('Connected to Supabase...');

        // Fetch a user to associate the properties with
        const { data: agent } = await supabase
            .from('users')
            .select('id')
            .eq('username', 'agent1')
            .single();

        let agentId = null;
        if (agent) {
            agentId = agent.id;
            console.log('Found agent1, linking properties to this user.');
        } else {
            console.log('User agent1 not found, properties will have no associated user.');
        }

        const sampleProperties = [
            {
                title: "Skyline Oasis Penthouse",
                description: "Experience unparalleled luxury in this breathtaking penthouse. Featuring floor-to-ceiling windows with panoramic city views, a private rooftop terrace, and custom Italian marble finishes throughout.",
                price: 5200000,
                location: "Manhattan, New York",
                pincode: "10019",
                image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                user_id: agentId,
                views: 342
            },
            {
                title: "Serene Coastal Villa",
                description: "A masterful blend of modern architecture and natural beauty. This beachfront villa offers 6 bedrooms, an infinity pool merging with the ocean horizon, and a private dock.",
                price: 8500000,
                location: "Malibu, California",
                pincode: "90265",
                image: "https://images.unsplash.com/photo-1613490908578-8318182283a0?auto=format&fit=crop&w=1200&q=80",
                user_id: agentId,
                views: 890
            },
            {
                title: "Architectural Glass House",
                description: "Nestled in a private wooded enclave, this award-winning glass house brings nature indoors. Features radiant heated floors, a chef's kitchen, and a detached art studio.",
                price: 3100000,
                location: "Portland, Oregon",
                pincode: "97205",
                image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
                user_id: agentId,
                views: 512
            },
            {
                title: "Historic Brownstone Estate",
                description: "Meticulously restored 19th-century brownstone featuring original mahogany woodwork, 5 wood-burning fireplaces, a landscaped garden, and a modern climate-controlled wine cellar.",
                price: 4750000,
                location: "Boston, Massachusetts",
                pincode: "02116",
                image: "https://images.unsplash.com/photo-1600607688969-a5bfcd64bd28?auto=format&fit=crop&w=1200&q=80",
                user_id: agentId,
                views: 420
            },
            {
                title: "Ultra-Modern Tech Mansion",
                description: "The home of the future. Fully automated via a central AI system, this estate includes a 20-car subterranean garage, indoor basketball court, and biometric security systems.",
                price: 12500000,
                location: "Austin, Texas",
                pincode: "78704",
                image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                user_id: agentId,
                views: 1250
            }
        ];

        console.log('Inserting sample properties...');
        const { data: inserted, error } = await supabase.from('properties').insert(sampleProperties).select();

        if (error) {
            console.error('Error inserting properties:', error);
        } else {
            console.log(`${inserted.length} properties added successfully!`);
        }

    } catch (err) {
        console.error('Error seeding properties:', err);
    } finally {
        console.log('Done.');
    }
}

seedProperties();
