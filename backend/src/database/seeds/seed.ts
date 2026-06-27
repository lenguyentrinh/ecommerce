import { AppDataSource } from '../data-source';
import { Product } from '../../modules/products/entities/product.entity';
import { productSeeds } from './product.seed';

/**
 * Idempotent product seeder.
 * Run with: `npm run seed`
 *
 * Skips products whose `name` already exists, so re-running is safe and only
 * inserts the missing rows.
 */
async function seed(): Promise<void> {
  await AppDataSource.initialize();
  console.log('📦 Data source initialised — seeding products...');

  const repo = AppDataSource.getRepository(Product);

  const existing = await repo.find({ select: { name: true } });
  const existingNames = new Set(existing.map((p) => p.name));

  const toInsert = productSeeds.filter((p) => !existingNames.has(p.name));

  if (toInsert.length === 0) {
    console.log('✅ All seed products already exist — nothing to insert.');
  } else {
    const entities = repo.create(toInsert);
    await repo.save(entities);
    console.log(`✅ Inserted ${toInsert.length} product(s).`);
  }

  const total = await repo.count();
  console.log(`📊 Products table now holds ${total} row(s).`);

  await AppDataSource.destroy();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
