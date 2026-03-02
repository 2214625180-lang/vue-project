import { HttpException, HttpStatus } from '@nestjs/common';

export class InventoryShortageException extends HttpException {
  constructor(skuId: string) {
    super(`Inventory shortage for SKU: ${skuId}`, HttpStatus.BAD_REQUEST);
  }
}
