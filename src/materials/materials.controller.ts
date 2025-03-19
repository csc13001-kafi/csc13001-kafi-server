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
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';
import { ATAuthGuard } from '../auth/guards/at-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dtos/create-material.dto';
import { UpdateMaterialDto } from './dtos/update-material.dto';

@Controller('materials')
export class MaterialsController {
    constructor(private readonly materialsService: MaterialsService) {}

    @ApiOperation({ summary: 'Create a new material [MANAGER]' })
    @ApiBearerAuth('access-token')
    @Post()
    @ApiResponse({
        status: 201,
        description: 'Material created successfully',
        type: CreateMaterialDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async create(@Body() createMaterialDto: CreateMaterialDto) {
        return this.materialsService.create(createMaterialDto);
    }

    @ApiOperation({ summary: 'Get all materials [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get()
    @ApiResponse({
        status: 200,
        description: 'Get all materials successfully',
        type: [CreateMaterialDto],
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    async findAll() {
        return this.materialsService.findAll();
    }

    @ApiOperation({ summary: 'Get a material by id [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Get(':id')
    @ApiResponse({
        status: 200,
        description: 'Get a material successfully',
        type: CreateMaterialDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    async findOne(@Param('id') id: string) {
        return this.materialsService.findById(id);
    }

    @ApiOperation({ summary: 'Update a material by id [EMPLOYEE, MANAGER]' })
    @ApiBearerAuth('access-token')
    @Patch(':id')
    @ApiResponse({
        status: 200,
        description: 'Material updated successfully',
        type: UpdateMaterialDto,
    })
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.EMPLOYEE, Role.MANAGER)
    async update(
        @Param('id') id: string,
        @Body() updateMaterialDto: UpdateMaterialDto,
    ) {
        return this.materialsService.update(id, updateMaterialDto);
    }

    @ApiOperation({ summary: 'Delete a material by id [MANAGER]' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Material deleted successfully',
    })
    @Delete(':id')
    @UseGuards(ATAuthGuard, RolesGuard)
    @Roles(Role.MANAGER)
    async remove(@Param('id') id: string) {
        return this.materialsService.delete(id);
    }
}
