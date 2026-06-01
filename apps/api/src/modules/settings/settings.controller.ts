import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ArrayMinSize, IsArray, IsDefined, IsString, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { SettingsService } from './settings.service';

class SettingInputDto {
  @IsString()
  @Matches(/^[a-z0-9]+(\.[a-z0-9]+)*$/)
  key!: string;

  @IsString()
  @Matches(/^[a-z0-9]+$/)
  group!: string;

  @IsDefined()
  value!: string | number | boolean | Record<string, unknown> | unknown[];
}

class UpdateSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SettingInputDto)
  settings!: SettingInputDto[];
}

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  list() {
    return this.settingsService.list();
  }

  @Patch()
  @RequirePermissions('settings.update')
  update(@Body() dto: UpdateSettingsDto, @CurrentUser() user: RequestUser) {
    return this.settingsService.updateMany(
      dto.settings.map((setting) => ({
        ...setting,
        value: setting.value as Prisma.InputJsonValue,
      })),
      user.id,
    );
  }
}
