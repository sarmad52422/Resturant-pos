import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ArrayUnique, IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { UsersService } from './users.service';

class CreateUserDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(120)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsString()
  roleId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username!: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  username?: string;
}

class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  password!: string;
}

class RoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds!: string[];
}

class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionIds?: string[];
}

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('user.manage')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.list();
  }

  @Post()
  createUser(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.createUser(dto, user);
  }

  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.updateUser(id, dto, user);
  }

  @Patch(':id/password')
  updatePassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto, @CurrentUser() user: RequestUser) {
    return this.usersService.updatePassword(id, dto.password, user);
  }

  @Post('roles')
  createRole(@Body() dto: RoleDto, @CurrentUser() user: RequestUser) {
    return this.usersService.createRole(dto, user);
  }

  @Patch('roles/:id')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: RequestUser) {
    return this.usersService.updateRole(id, dto, user);
  }
}
