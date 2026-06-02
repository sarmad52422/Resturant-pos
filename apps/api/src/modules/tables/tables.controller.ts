import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TableStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { TablesService } from './tables.service';

class TableDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  area?: string;

  @IsInt()
  @Min(1)
  @Max(99)
  capacity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}

class UpdateTableDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  area?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}

class TableStatusDto {
  @IsEnum(TableStatus)
  status!: TableStatus;
}

@Controller('tables')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  floor() {
    return this.tablesService.floor();
  }

  @Post()
  @RequirePermissions('table.manage')
  create(@Body() dto: TableDto) {
    return this.tablesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('table.manage')
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('table.manage')
  updateStatus(@Param('id') id: string, @Body() dto: TableStatusDto) {
    return this.tablesService.setStatus(id, dto.status);
  }

  @Post(':id/start-order')
  @RequirePermissions('order.create')
  startOrder(@Param('id') id: string) {
    return this.tablesService.startDineInOrder(id);
  }
}
