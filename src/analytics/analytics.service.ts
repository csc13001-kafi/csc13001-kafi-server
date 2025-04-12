import { Injectable, Logger } from '@nestjs/common';
import { Role } from '../auth/enums/roles.enum';
import { OrdersRepository } from 'src/orders/orders.repository';
import { UsersRepository } from 'src/users/users.repository';
import { ProductsRepository } from 'src/products/products.repository';
import { CategoriesRepository } from 'src/categories/categories.repository';
import { Product } from 'src/products/entities/product.model';
@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly usersRepository: UsersRepository,
        private readonly productsRepository: ProductsRepository,
        private readonly categoriesRepository: CategoriesRepository,
    ) {}

    async getOrdersCountByTimeRange(
        startDate: Date,
        endDate: Date,
    ): Promise<number> {
        try {
            return await this.ordersRepository.countByTimeRange(
                startDate,
                endDate,
            );
        } catch (error) {
            this.logger.error(
                `Error in orders count service: ${error.message}`,
            );
            throw new Error('Failed to get orders count by time range');
        }
    }

    async getProducts(): Promise<Product[]> {
        try {
            return await this.productsRepository.findAll();
        } catch (error) {
            this.logger.error(`Error in products service: ${error.message}`);
            throw new Error('Failed to get products');
        }
    }

    async getCategoriesCount(): Promise<number> {
        try {
            return await this.categoriesRepository.countCategories();
        } catch (error) {
            this.logger.error(
                `Error in categories count service: ${error.message}`,
            );
            throw new Error('Failed to get categories count');
        }
    }

    async getUsersCountByRole(role: Role): Promise<number> {
        try {
            return await this.usersRepository.countByRole(role);
        } catch (error) {
            this.logger.error(`Error in users count service: ${error.message}`);
            throw new Error(`Failed to get users count with role ${role}`);
        }
    }

    async getProductsCount(): Promise<number> {
        try {
            return await this.productsRepository.countProducts();
        } catch (error) {
            this.logger.error(
                `Error in products count service: ${error.message}`,
            );
            throw new Error('Failed to get products count');
        }
    }

    async getDashboardStats(startDate: Date, endDate: Date): Promise<any> {
        try {
            // Business logic: Get all stats in parallel for efficiency
            const [
                ordersCount,
                categoriesCount,
                employeesCount,
                managersCount,
                productsCount,
            ] = await Promise.all([
                this.getOrdersCountByTimeRange(startDate, endDate),
                this.getCategoriesCount(),
                this.getUsersCountByRole(Role.EMPLOYEE),
                this.getUsersCountByRole(Role.MANAGER),
                this.getProductsCount(),
            ]);

            // Business logic: Format the response data
            return {
                ordersCount,
                categoriesCount,
                employeesCount,
                managersCount,
                productsCount,
                timeRange: {
                    startDate,
                    endDate,
                },
            };
        } catch (error) {
            this.logger.error(
                `Error in dashboard stats service: ${error.message}`,
            );
            throw new Error('Failed to get dashboard statistics');
        }
    }
}
