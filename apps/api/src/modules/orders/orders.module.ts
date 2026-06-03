import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { KitchenModule } from '../kitchen/kitchen.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [InventoryModule, KitchenModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
