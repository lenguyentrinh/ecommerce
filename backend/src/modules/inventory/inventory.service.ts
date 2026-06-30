import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { InventoryReserve } from './entities/inventory-reserve.entity';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectRepository(InventoryReserve)
    private readonly reserveRepository: Repository<InventoryReserve>,
  ) {}

  // Delete expired reserves. Safe (no-op) against an empty table. Reserve /
  // release creation is Epic 4 (checkout) — this story only prunes.
  async releaseExpired(): Promise<number> {
    try {
      const result = await this.reserveRepository.delete({
        expiresAt: LessThan(new Date()),
      });
      return result.affected ?? 0;
    } catch (error) {
      this.logger.error('Failed to release expired inventory reserves', error);
      return 0;
    }
  }
}
