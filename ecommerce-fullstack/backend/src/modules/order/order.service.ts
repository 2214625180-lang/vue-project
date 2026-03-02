  async findOne(userId: string, orderNo: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNo },
      include: {
        items: true,
      }
    });
    
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }
