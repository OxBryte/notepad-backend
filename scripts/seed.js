// scripts/seed.js
const { query, pool } = require('../database/connection');
const logger = require('../src/utils/logger');

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Clear existing data (optional - be careful in production!)
    const clearData = process.argv.includes('--clear');
    
    if (clearData) {
      console.log('🧹 Clearing existing data...');
      await query('TRUNCATE TABLE interactions, ideas, users RESTART IDENTITY CASCADE');
    }

    // Create sample users
    console.log('👥 Creating sample users...');
    const users = [
      {
        wallet: '0x1234567890123456789012345678901234567890',
        username: 'alice_innovator',
        bio: 'Passionate about building the future through blockchain technology.'
      },
      {
        wallet: '0x2345678901234567890123456789012345678901',
        username: 'bob_builder',
        bio: 'Full-stack developer with a love for decentralized applications.'
      },
      {
        wallet: '0x3456789012345678901234567890123456789012',
        username: 'charlie_creator',
        bio: 'Artist and designer exploring the intersection of art and technology.'
      },
      {
        wallet: '0x4567890123456789012345678901234567890123',
        username: 'diana_dev',
        bio: 'Smart contract developer building the next generation of DeFi.'
      }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await query(`
        INSERT INTO users (wallet_address, username, bio, created_at, last_login)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (wallet_address) DO UPDATE SET
          username = EXCLUDED.username,
          bio = EXCLUDED.bio,
          last_login = NOW()
        RETURNING id
      `, [user.wallet, user.username, user.bio]);
      
      userIds.push(result.rows[0].id);
    }

    // Create sample ideas
    console.log('💡 Creating sample ideas...');
    const ideas = [
      {
        title: 'Decentralized Learning Platform',
        content: 'A blockchain-based platform where experts can create courses and learners earn NFT certificates. Smart contracts handle payments and verification automatically. The platform would feature peer-to-peer learning, community governance, and token incentives for quality content creation.',
        category: 'education',
        tags: ['blockchain', 'education', 'nft', 'learning', 'certification']
      },
      {
        title: 'Carbon Credit Marketplace',
        content: 'An automated marketplace for carbon credits using IoT sensors to verify actual carbon capture. Real-time monitoring ensures authentic environmental impact. Companies can purchase verified credits while supporting genuine climate action projects.',
        category: 'environment',
        tags: ['carbon', 'iot', 'marketplace', 'climate', 'sustainability']
      },
      {
        title: 'AI-Powered Code Review',
        content: 'An AI assistant that provides intelligent code reviews, suggests optimizations, and helps maintain code quality across development teams. It learns from your codebase patterns and industry best practices.',
        category: 'technology',
        tags: ['ai', 'development', 'code-review', 'automation', 'productivity']
      },
      {
        title: 'Community-Owned Food Delivery',
        content: 'A cooperative food delivery platform owned by drivers, restaurants, and customers. Profits are shared among stakeholders, reducing fees and improving working conditions for delivery workers.',
        category: 'business',
        tags: ['cooperative', 'food-delivery', 'community', 'profit-sharing']
      },
      {
        title: 'Digital Art Collaboration Tool',
        content: 'A platform for artists to collaborate on digital artworks, with blockchain-based attribution and revenue sharing. Each contributor gets recognized and compensated based on their contribution.',
        category: 'arts',
        tags: ['digital-art', 'collaboration', 'blockchain', 'revenue-sharing']
      },
      {
        title: 'Mental Health Support Network',
        content: 'A peer-to-peer mental health support platform connecting people with similar experiences. Features anonymous chat, resource sharing, and professional therapist integration.',
        category: 'health',
        tags: ['mental-health', 'peer-support', 'wellness', 'community']
      }
    ];

    const ideaIds = [];
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      const userId = userIds[i % userIds.length];
      
      const result = await query(`
        INSERT INTO ideas (user_id, title, content, category, tags, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days')
        RETURNING id
      `, [userId, idea.title, idea.content, idea.category, idea.tags]);
      
      ideaIds.push(result.rows[0].id);
    }

    // Create sample interactions
    console.log('💬 Creating sample interactions...');
    const interactionTypes = ['like', 'comment', 'build'];
    const comments = [
      'This is a brilliant idea! I would love to contribute to this project.',
      'Have you considered integrating with existing platforms?',
      'This could revolutionize the industry. Count me in!',
      'I have experience in this area and would like to collaborate.',
      'Excellent concept! The implementation details would be interesting to discuss.',
      'This addresses a real problem. How do we get started?'
    ];

    for (let i = 0; i < 20; i++) {
      const ideaId = ideaIds[Math.floor(Math.random() * ideaIds.length)];
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];
      const content = type === 'comment' ? comments[Math.floor(Math.random() * comments.length)] : null;

      await query(`
        INSERT INTO interactions (idea_id, user_id, interaction_type, content, created_at)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 20)} days')
        ON CONFLICT (idea_id, user_id, interaction_type) DO NOTHING
      `, [ideaId, userId, type, content]);
    }

    // Create some follow relationships
    console.log('👥 Creating follow relationships...');
    for (let i = 0; i < userIds.length; i++) {
      for (let j = 0; j < userIds.length; j++) {
        if (i !== j && Math.random() > 0.5) {
          await query(`
            INSERT INTO follows (follower_id, following_id, created_at)
            VALUES ($1, $2, NOW() - INTERVAL '${Math.floor(Math.random() * 15)} days')
            ON CONFLICT (follower_id, following_id) DO NOTHING
          `, [userIds[i], userIds[j]]);
        }
      }
    }

    console.log('✅ Database seeded successfully!');
    
    // Show summary
    const summary = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM ideas) as ideas_count,
        (SELECT COUNT(*) FROM interactions) as interactions_count,
        (SELECT COUNT(*) FROM follows) as follows_count
    `);
    
    const stats = summary.rows[0];
    console.log('📊 Seeding summary:');
    console.log(`  - Users: ${stats.users_count}`);
    console.log(`  - Ideas: ${stats.ideas_count}`);
    console.log(`  - Interactions: ${stats.interactions_count}`);
    console.log(`  - Follows: ${stats.follows_count}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
