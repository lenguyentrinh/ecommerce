import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryReserve } from './entities/inventory-reserve.entity';
import { InventoryService } from './inventory.service';
import { InventoryScheduler } from './inventory.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryReserve])],
  providers: [InventoryService, InventoryScheduler],
  exports: [InventoryService],
})
export class InventoryModule {}
