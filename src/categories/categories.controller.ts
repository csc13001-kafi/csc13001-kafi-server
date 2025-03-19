import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MenuDto } from './dtos/menu.dto';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @ApiOperation({ summary: 'Create a new category [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post()
    @ApiResponse({
        status: 201,
        description: 'Category created successfully',
        type: CreateCategoryDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @ApiOperation({
        summary: 'Get all categories with products [GUEST, EMPLOYEE, MANAGER]',
    })
    @ApiBearerAuth('access-token')
    @Get('products')
    @ApiResponse({
        status: 200,
        description: 'Get all categories with products successfully',
        type: MenuDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.GUEST, Role.EMPLOYEE, Role.MANAGER)
    async findAllWithProducts() {
        return this.categoriesService.findAllWithProducts();
    }

    @ApiOperation({ summary: 'Get all categories [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get all categories successfully',
        type: [CreateCategoryDto],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async findAll() {
        return this.categoriesService.findAll();
    }

    @ApiOperation({
        summary: 'Get a category by id [GUEST, EMPLOYEE, MANAGER]',
    })
    @ApiBearerAuth('access-token')
    @Get(':id')
    @ApiResponse({
        status: 200,
        description: 'Get a category successfully',
        type: CreateCategoryDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.GUEST, Role.EMPLOYEE, Role.MANAGER)
    async findOne(@Param('id') id: string) {
        return this.categoriesService.findById(id);
    }

    @ApiOperation({ summary: 'Update a category by id [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Patch(':id')
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
        type: UpdateCategoryDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, updateProductDto);
    }

    @ApiOperation({ summary: 'Delete a category by id [MANAGER]' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Category deleted successfully',
    })
    @Delete(':id')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async remove(@Param('id') id: string) {
        return this.categoriesService.delete(id);
    }
}
