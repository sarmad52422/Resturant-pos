import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CurrentUser, type RequestUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { ShiftsService } from './shifts.service';

class OpenShiftDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @IsNumber()
  @Min(0)
  @Max(999999999)
  openingCash!: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  terminalDevice?: string;
}

class CloseShiftDto {
  @IsNumber()
  @Min(0)
  @Max(999999999)
  countedCash!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999)
  expenses?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

@Controller('shifts')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.shiftsService.list(user);
  }

  @Post('open')
  open(@Body() dto: OpenShiftDto, @CurrentUser() user: RequestUser) {
    return this.shiftsService.openShift(dto, user);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseShiftDto, @CurrentUser() user: RequestUser) {
    return this.shiftsService.closeShift(id, dto, user);
  }

  @Patch(':id/recalculate')
  recalculate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.shiftsService.recalculateShift(id, user);
  }
}
