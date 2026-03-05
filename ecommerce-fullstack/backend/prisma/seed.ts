import { PrismaClient, ProductStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean up existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productSku.deleteMany();
  await prisma.productSpu.deleteMany();
  await prisma.category.deleteMany();
  console.log('Deleted existing data.');

  // 2. Create Categories
  const catElectronics = await prisma.category.create({
    data: { name: 'Electronics' },
  });
  
  const catPhones = await prisma.category.create({
    data: { name: 'Smartphones', parentId: catElectronics.id },
  });

  const catComputers = await prisma.category.create({
    data: { name: 'Computers', parentId: catElectronics.id },
  });
  
  const catAudio = await prisma.category.create({
    data: { name: 'Audio', parentId: catElectronics.id },
  });

  console.log('Created categories.');

  // 3. Create SPUs (Products)

  // SPU 1: iPhone 15 Pro
  const spuPhone = await prisma.productSpu.create({
    data: {
      name: 'iPhone 15 Pro',
      spuNo: 'SPU001',
      description: 'The ultimate iPhone with titanium design.',
      categoryId: catPhones.id,
      status: ProductStatus.ON_SHELF,
    },
  });

  // SPU 2: MacBook Pro 14
  const spuLaptop = await prisma.productSpu.create({
    data: {
      name: 'MacBook Pro 14"',
      spuNo: 'SPU002',
      description: 'Supercharged by M3 Pro and M3 Max.',
      categoryId: catComputers.id,
      status: ProductStatus.ON_SHELF,
    },
  });

  // SPU 3: Sony WH-1000XM5
  const spuHeadphone = await prisma.productSpu.create({
    data: {
      name: 'Sony WH-1000XM5',
      spuNo: 'SPU003',
      description: 'Industry-leading noise canceling headphones.',
      categoryId: catAudio.id,
      status: ProductStatus.ON_SHELF,
    },
  });

  // SPU 4: Samsung Galaxy S24
  const spuSamsung = await prisma.productSpu.create({
    data: {
      name: 'Samsung Galaxy S24 Ultra',
      spuNo: 'SPU004',
      description: 'Galaxy AI is here.',
      categoryId: catPhones.id,
      status: ProductStatus.ON_SHELF,
    },
  });

  // SPU 5: Dell XPS 13
  const spuDell = await prisma.productSpu.create({
    data: {
      name: 'Dell XPS 13',
      spuNo: 'SPU005',
      description: 'Iconic design. Now even more powerful.',
      categoryId: catComputers.id,
      status: ProductStatus.ON_SHELF,
    },
  });

  console.log('Created SPUs.');

  // 4. Create SKUs

  // iPhone SKUs
  await prisma.productSku.create({
    data: {
      spuId: spuPhone.id,
      skuNo: 'SKU001-1',
      price: 999.00,
      stock: 100,
      specs: { color: 'Natural Titanium', storage: '128GB' },
      coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    },
  });
  await prisma.productSku.create({
    data: {
      spuId: spuPhone.id,
      skuNo: 'SKU001-2',
      price: 1099.00,
      stock: 50,
      specs: { color: 'Blue Titanium', storage: '256GB' },
      coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    },
  });

  // MacBook SKUs
  await prisma.productSku.create({
    data: {
      spuId: spuLaptop.id,
      skuNo: 'SKU002-1',
      price: 1999.00,
      stock: 20,
      specs: { chip: 'M3 Pro', ram: '18GB', ssd: '512GB' },
      coverImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    },
  });

  // Headphone SKUs
  await prisma.productSku.create({
    data: {
      spuId: spuHeadphone.id,
      skuNo: 'SKU003-1',
      price: 348.00,
      stock: 200,
      specs: { color: 'Black' },
      coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
  });
  await prisma.productSku.create({
    data: {
      spuId: spuHeadphone.id,
      skuNo: 'SKU003-2',
      price: 348.00,
      stock: 150,
      specs: { color: 'Silver' },
      coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
  });

   // Samsung SKUs
   await prisma.productSku.create({
    data: {
      spuId: spuSamsung.id,
      skuNo: 'SKU004-1',
      price: 1299.00,
      stock: 80,
      specs: { color: 'Titanium Gray', storage: '512GB' },
      coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', // Reusing phone image for demo
    },
  });

  // Dell SKUs
  await prisma.productSku.create({
    data: {
      spuId: spuDell.id,
      skuNo: 'SKU005-1',
      price: 1199.00,
      stock: 40,
      specs: { processor: 'Intel Core Ultra 7', ram: '16GB', ssd: '512GB' },
      coverImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', // Reusing laptop image
    },
  });

  console.log('Created SKUs.');
  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
