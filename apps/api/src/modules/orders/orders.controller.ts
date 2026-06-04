import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
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
  @IsOptional()
  @IsString()
  customerId?: string;

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

class PaymentDto {
  @IsNumber()
  @Min(0.01)
  @Max(999999999)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;
}

class VoidOrderDto {
  @IsString()
  reason!: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(
    @Query('date') date?: 'today' | 'all',
    @Query('search') search?: string,
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.listOrders({ date, search, status });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Post()
  @RequirePermissions('order.create')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: RequestUser) {
    return this.ordersService.createDraft(dto, user.id);
  }

  @Patch(':id/send-to-kitchen')
  @RequirePermissions('order.send_to_kitchen')
  sendToKitchen(@Param('id') id: string) {
    return this.ordersService.sendToKitchen(id);
  }

  @Post(':id/payments')
  @RequirePermissions('order.create')
  pay(@Param('id') id: string, @Body() dto: PaymentDto) {
    return this.ordersService.recordPayment(id, dto);
  }

  @Patch(':id/void')
  @RequirePermissions('order.void')
  void(@Param('id') id: string, @Body() dto: VoidOrderDto, @CurrentUser() user: RequestUser) {
    return this.ordersService.voidOrder(id, dto, user.id);
  }

  @Patch(':id/items/:itemId/void')
  @RequirePermissions('order.void')
  voidItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: VoidOrderDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.ordersService.voidOrderItem(id, itemId, dto, user.id);
  }
}
