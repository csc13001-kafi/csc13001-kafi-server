import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    BadRequestException,
    UploadedFile,
    UseInterceptors,
    ParseUUIDPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Multer } from 'multer';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @ApiOperation({ summary: 'Create a new product [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post()
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                name: { type: 'string' },
                price: { type: 'number' },
                onStock: { type: 'boolean' },
                categoryId: { type: 'string' },
                materials: {
                    type: 'array',
                    items: { type: 'string' },
                },
                quantity: {
                    type: 'array',
                    items: { type: 'number' },
                },
            },
            required: [
                'file',
                'name',
                'price',
                'onStock',
                'categoryId',
                'materials',
                'quantity',
            ],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Product created successfully',
        type: CreateProductDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    @UseInterceptors(FileInterceptor('file'))
    async create(
        @UploadedFile() file: Multer.File,
        @Body() createProductDto: CreateProductDto,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return this.productsService.create(createProductDto, file);
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
    async findAll(@Request() req: any) {
        const userRole = req.user?.role;
        if (userRole === Role.GUEST) {
            return this.productsService.findAll();
        }
        return this.productsService.findAllExtended();
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
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            required: [],
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description:
                        'Optional new image file to update the product image',
                },
                name: { type: 'string' },
                price: { type: 'number' },
                onStock: { type: 'boolean' },
                categoryId: { type: 'string' },
                materials: {
                    type: 'array',
                    items: { type: 'string' },
                },
                quantity: {
                    type: 'array',
                    items: { type: 'number' },
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Product updated successfully',
        type: UpdateProductDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    @UseInterceptors(FileInterceptor('file'))
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @UploadedFile() file: Multer.File,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        return this.productsService.update(id, updateProductDto, file);
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
