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
        } catch (error: any) {
            throw new Error(
                `Failed to get orders count by time range: ${error.message}`,
            );
        }
    }

    async getOrdersTotalPriceByTimeRange(
        startDate: Date,
        endDate: Date,
    ): Promise<number> {
        try {
            return await this.ordersRepository.getTotalPriceByTimeRange(
                startDate,
                endDate,
            );
        } catch (error: any) {
            throw new Error(
                `Failed to get orders total price by time range: ${error.message}`,
            );
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
        } catch (error: any) {
            throw new Error(`Failed to get products count: ${error.message}`);
        }
    }

    async getDashboardStats(startDate: Date, endDate: Date): Promise<any> {
        try {
            const localStartDate = new Date(startDate);
            const localEndDate = new Date(endDate);

            const currentYear = new Date().getFullYear();
            if (localStartDate.getFullYear() !== currentYear) {
                localStartDate.setFullYear(currentYear);
            }
            if (localEndDate.getFullYear() !== currentYear) {
                localEndDate.setFullYear(currentYear);
            }

            const [
                ordersCount,
                ordersTotalPrice,
                categoriesCount,
                productsCount,
                customersCount,
            ] = await Promise.all([
                this.getOrdersCountByTimeRange(localStartDate, localEndDate),
                this.getOrdersTotalPriceByTimeRange(
                    localStartDate,
                    localEndDate,
                ),
                this.getCategoriesCount(),
                this.getProductsCount(),
                this.getUsersCountByRole(Role.GUEST),
            ]);

            const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
            const localStartDateFormatted = new Date(
                localStartDate.getTime() - timeZoneOffset,
            );
            const localEndDateFormatted = new Date(
                localEndDate.getTime() - timeZoneOffset,
            );

            return {
                Overview: {
                    ordersCount,
                    ordersTotalPrice,
                },
                Product: {
                    categoriesCount,
                    productsCount,
                },
                Membership: customersCount,
                timeRange: {
                    startDate: localStartDateFormatted,
                    endDate: localEndDateFormatted,
                },
            };
        } catch (error: any) {
            throw new Error(
                `Failed to get dashboard statistics: ${error.message}`,
            );
        }
    }
}
