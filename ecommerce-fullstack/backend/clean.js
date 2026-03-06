const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 正在强制清理幽灵订单数据...');
  
  // 🚨 核心逻辑：必须先删除子表（OrderItem），再删除主表（Order）
  const deletedItems = await prisma.orderItem.deleteMany({});
  console.log(`✅ 成功删除了 ${deletedItems.count} 条崩溃的订单项！`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✅ 成功删除了 ${deletedOrders.count} 条崩溃的订单主记录！`);
  
  console.log('🎉 数据库已彻底净化，赶紧去前台刷新吧！');
}

main()
  .catch((e) => {
    console.error('❌ 清理失败，报错信息：', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });