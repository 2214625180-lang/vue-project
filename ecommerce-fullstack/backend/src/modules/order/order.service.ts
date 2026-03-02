  async getMyOrders(userId: string, dto: GetMyOrdersDto) {
    const { page = 1, limit = 10, status } = dto;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

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
