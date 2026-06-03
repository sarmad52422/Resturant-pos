import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
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

  @IsNumber()
  @Min(0.0001)
  @Max(999999)
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
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list() {
    return this.ordersService.listOpenOrders();
  }

  @Post()
  @RequirePermissions('order.create')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createDraft(dto);
  }

  @Patch(':id/send-to-kitchen')
  @RequirePermissions('order.send_to_kitchen')
  sendToKitchen(@Param('id') id: string) {
    return this.ordersService.sendToKitchen(id);
  }
}
