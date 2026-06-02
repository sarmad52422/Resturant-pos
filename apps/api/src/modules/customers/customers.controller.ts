import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { CustomersService } from './customers.service';

class CustomerDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999999)
  creditLimit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerType?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  notes?: string;

  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone!: string;
}

class UpdateCustomerDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999999)
  creditLimit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  customerType?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  notes?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(30)
  phone?: string;
}

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list() {
    return this.customersService.list();
  }

  @Post()
  @RequirePermissions('customer.manage')
  create(@Body() dto: CustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('customer.manage')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }
}
