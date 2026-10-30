import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { createRequire } from 'module';
import { execSync } from 'child_process';

const require = createRequire(import.meta.url);
const contractJson = require('../src/prisma/contract.json');

const supabaseUrl = process.argv[2] || process.env.SUPABASE_DATABASE_URL;

if (!supabaseUrl) {
  console.error('\n❌ Error: Please provide your Supabase database URL.\n');
  console.error('Usage:');
  console.error('  node scripts/migrate-to-supabase.js "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"\n');
  process.exit(1);
}

async function migrate() {
  console.log('\n=========================================');
  console.log('🚀 Migrating SaaS Database to Supabase');
  console.log('=========================================\n');

  // Step 1: Connect to local source database
  console.log('📦 1. Reading existing data from local database...');
  const localDb = postgres({
    contractJson,
    url: process.env.DATABASE_URL,
    verifyMarker: false
  });

  let users = [];
  let products = [];
  try {
    users = await localDb.orm.public.User.all();
    products = await localDb.orm.public.Product.all();
    console.log(`   Found ${users.length} user(s) and ${products.length} product(s) locally.`);
  } catch (err) {
    console.error('   ❌ Failed to read from local database:', err.message);
    process.exit(1);
  }

  // Step 2: Initialize Supabase schema using Prisma
  console.log('\n🛠️  2. Syncing Prisma schema to Supabase...');
  try {
    // Determine database name from URL (default 'postgres' for Supabase)
    const parsed = new URL(supabaseUrl);
    const dbName = parsed.pathname.replace(/^\//, '') || 'postgres';
    console.log(`   Applying tables to Supabase DB [${dbName}]...`);
    execSync(`npx prisma db update --db "${supabaseUrl}" --no-interactive --confirm ${dbName}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('   ✅ Tables & constraints synced to Supabase successfully.');
  } catch (err) {
    console.warn('   ⚠️ Note on schema push:', err.message);
    console.log('   Continuing to data copy step...');
  }

  // Step 3: Connect to Supabase target database
  console.log('\n🔗 3. Connecting to Supabase database...');
  const remoteDb = postgres({
    contractJson,
    url: supabaseUrl,
    verifyMarker: false
  });

  // Step 4: Copy Users
  console.log('\n👤 4. Copying Users...');
  let usersCopied = 0;
  for (const user of users) {
    try {
      const existing = await remoteDb.orm.public.User.where({ email: user.email }).first();
      if (!existing) {
        await remoteDb.orm.public.User.create({
          id: user.id,
          email: user.email,
          password: user.password,
          storeName: user.storeName,
          currency: user.currency || 'EGP',
          whatsappNumber: user.whatsappNumber,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
        usersCopied++;
        console.log(`   ✅ Copied user: ${user.email} (${user.storeName})`);
      } else {
        console.log(`   ⏩ User already exists on Supabase: ${user.email}`);
      }
    } catch (err) {
      console.error(`   ❌ Failed copying user ${user.email}:`, err.message);
    }
  }

  // Step 5: Copy Products
  console.log('\n📦 5. Copying Products...');
  let productsCopied = 0;
  for (const prod of products) {
    try {
      const existing = await remoteDb.orm.public.Product.where({ id: prod.id }).first();
      if (!existing) {
        await remoteDb.orm.public.Product.create({
          id: prod.id,
          name: prod.name,
          description: prod.description,
          price: prod.price,
          stock: prod.stock,
          images: prod.images,
          colors: prod.colors,
          userId: prod.userId,
          createdAt: prod.createdAt,
          updatedAt: prod.updatedAt
        });
        productsCopied++;
        console.log(`   ✅ Copied product: ${prod.name}`);
      } else {
        console.log(`   ⏩ Product already exists: ${prod.name}`);
      }
    } catch (err) {
      console.error(`   ❌ Failed copying product ${prod.name}:`, err.message);
    }
  }

  console.log('\n=========================================');
  console.log(`🎉 Migration Completed Successfully!`);
  console.log(`   - Users copied: ${usersCopied} / ${users.length}`);
  console.log(`   - Products copied: ${productsCopied} / ${products.length}`);
  console.log('=========================================\n');
  console.log('👉 Next Step:');
  console.log('   In Render Dashboard > "social-media-sellers" Web Service > Environment:');
  console.log(`   Set DATABASE_URL = "${supabaseUrl}"`);
  console.log('   Render will redeploy and your app will be 100% active!\n');

  process.exit(0);
}

migrate().catch(e => {
  console.error('\n❌ Unhandled Migration Error:', e);
  process.exit(1);
});
