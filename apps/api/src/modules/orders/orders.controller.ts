import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrdersService } from './orders.service';

enum CreateOrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
}

class CreateOrderItemDto {
  @IsString()
  menuItemId!: string;

  @IsOptional()
  @IsString()
  variationId?: string;

  quantity!: number;
}

class CreateOrderDto {
  @IsEnum(CreateOrderType)
  type!: CreateOrderType;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list() {
    return this.ordersService.listOpenOrders();
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createDraft(dto);
  }

  @Patch(':id/send-to-kitchen')
  sendToKitchen(@Param('id') id: string) {
    return this.ordersService.sendToKitchen(id);
  }
}
