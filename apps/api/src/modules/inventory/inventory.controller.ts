import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { InventoryService } from './inventory.service';

class InventoryItemDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  averageCost?: number;

  @IsOptional()
  @IsBoolean()
  batchTrackingEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  @Max(999999)
  conversionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  currentStock?: number;

  @IsOptional()
  @IsBoolean()
  expiryTrackingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  lastPurchaseCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  minimumStockLevel?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  purchaseUnitId!: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsString()
  usageUnitId!: string;
}

class UpdateInventoryItemDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  averageCost?: number;

  @IsOptional()
  @IsBoolean()
  batchTrackingEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  @Max(999999)
  conversionRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  currentStock?: number;

  @IsOptional()
  @IsBoolean()
  expiryTrackingEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  lastPurchaseCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  minimumStockLevel?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  purchaseUnitId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  usageUnitId?: string;
}

class PurchaseItemDto {
  @IsString()
  inventoryItemId!: string;

  @IsNumber()
  @Min(0.0001)
  @Max(999999)
  quantity!: number;

  @IsString()
  unitId!: string;

  @IsNumber()
  @Min(0)
  @Max(999999)
  unitCost!: number;
}

class CreatePurchaseDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items!: PurchaseItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(60)
  invoiceNumber?: string;

  @IsNumber()
  @Min(0)
  @Max(999999999)
  paidAmount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsISO8601()
  purchaseDate!: string;

  @IsString()
  supplierId!: string;
}

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  list() {
    return this.inventoryService.list();
  }

  @Get('purchases')
  purchases() {
    return this.inventoryService.listPurchases();
  }

  @Post('items')
  @RequirePermissions('inventory.manage')
  createItem(@Body() dto: InventoryItemDto) {
    return this.inventoryService.createItem(dto);
  }

  @Patch('items/:id')
  @RequirePermissions('inventory.manage')
  updateItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.updateItem(id, dto);
  }

  @Post('purchases')
  @RequirePermissions('inventory.manage')
  createPurchase(@Body() dto: CreatePurchaseDto) {
    return this.inventoryService.createPurchase(dto);
  }
}
