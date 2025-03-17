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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @ApiOperation({ summary: 'Create a new product [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post()
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
        type: CreateProductDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async create(@Body() createProductDto: CreateProductDto) {
        console.log(createProductDto);
        return this.productsService.create(createProductDto);
    }

    @ApiOperation({ summary: 'Get all products [GUEST, EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get all products successfully',
        type: [CreateProductDto],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.GUEST, Role.EMPLOYEE, Role.MANAGER)
    async findAll() {
        return this.productsService.findAll();
    }

    @ApiOperation({ summary: 'Get a product by id [GUEST, EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get(':id')
    @ApiResponse({
        status: 200,
        description: 'Get a product successfully',
        type: CreateProductDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.GUEST, Role.EMPLOYEE, Role.MANAGER)
    async findOne(@Param('id') id: string) {
        return this.productsService.findById(id);
    }

    @ApiOperation({ summary: 'Update a product by id [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Patch(':id')
    @ApiResponse({
        status: 200,
        description: 'Product updated successfully',
        type: UpdateProductDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        return this.productsService.update(id, updateProductDto);
    }

    @ApiOperation({ summary: 'Delete a product by id [MANAGER]' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Product deleted successfully',
    })
    @Delete(':id')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async remove(@Param('id') id: string) {
        return this.productsService.delete(id);
    }
}
