import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryScheduler {
  private readonly logger = new Logger(InventoryScheduler.name);

  constructor(private readonly inventoryService: InventoryService) {}

  // Prune expired inventory reserves every 5 minutes (Story 3.1 AC2).
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanup(): Promise<void> {
    const removed = await this.inventoryService.releaseExpired();
    if (removed > 0) {
      this.logger.log(`Released ${removed} expired inventory reserve(s)`);
    }
  }
}
