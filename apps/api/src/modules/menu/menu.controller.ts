import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsArray,
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
import { MenuService } from './menu.service';

class CategoryDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}

class MenuItemDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsNumber()
  @Min(0)
  @Max(999999)
  basePrice!: number;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  costEstimate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  preparationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  recipeRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  shortName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;
}

class UpdateCategoryDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;
}

class UpdateMenuItemDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  basePrice?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999)
  costEstimate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsString()
  kitchenStationId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  preparationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  recipeRequired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  shortName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;
}

class RecipeIngredientDto {
  @IsString()
  inventoryItemId!: string;

  @IsNumber()
  @Min(0.0001)
  @Max(999999)
  quantity!: number;

  @IsString()
  unitId!: string;
}

class RecipeDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  ingredients!: RecipeIngredientDto[];

  @IsString()
  menuItemId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  variationId?: string;
}

@Controller('menu')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  summary() {
    return this.menuService.summary();
  }

  @Get('recipes')
  recipes() {
    return this.menuService.recipeBuilder();
  }

  @Post('categories')
  @RequirePermissions('menu.manage')
  createCategory(@Body() dto: CategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermissions('menu.manage')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menuService.updateCategory(id, dto);
  }

  @Post('items')
  @RequirePermissions('menu.manage')
  createItem(@Body() dto: MenuItemDto) {
    return this.menuService.createItem(dto);
  }

  @Patch('items/:id')
  @RequirePermissions('menu.manage')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menuService.updateItem(id, dto);
  }

  @Post('recipes')
  @RequirePermissions('recipe.manage')
  createRecipe(@Body() dto: RecipeDto) {
    return this.menuService.createRecipe(dto);
  }

  @Patch('recipes/:id')
  @RequirePermissions('recipe.manage')
  updateRecipe(@Param('id') id: string, @Body() dto: RecipeDto) {
    return this.menuService.updateRecipe(id, dto);
  }
}
