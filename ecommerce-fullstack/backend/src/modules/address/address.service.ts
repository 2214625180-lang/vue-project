import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createAddressDto: CreateAddressDto) {
    const { isDefault, ...data } = createAddressDto;

    // Transactional logic for default address
    return this.prisma.$transaction(async (prisma) => {
      if (isDefault) {
        await prisma.userAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      // If it's the first address, make it default automatically
      const count = await prisma.userAddress.count({ where: { userId } });
      const shouldBeDefault = isDefault || count === 0;

      return prisma.userAddress.create({
        data: {
          ...data,
          isDefault: shouldBeDefault,
          userId,
        },
      });
    });
  }

  async findAll(userId: string) {
    return this.prisma.userAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // Default address first
        { updatedAt: 'desc' },
      ],
    });
  }

  async findOne(id: string, userId: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async update(id: string, userId: string, updateAddressDto: UpdateAddressDto) {
    const { isDefault, ...data } = updateAddressDto;

    return this.prisma.$transaction(async (prisma) => {
      // Check ownership
      const existing = await prisma.userAddress.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new NotFoundException('Address not found');

      if (isDefault) {
        await prisma.userAddress.updateMany({
          where: { userId, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return prisma.userAddress.update({
        where: { id },
        data: {
          ...data,
          ...(isDefault !== undefined && { isDefault }),
        },
      });
    });
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.userAddress.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Address not found');

    return this.prisma.userAddress.delete({
      where: { id },
    });
  }
}
