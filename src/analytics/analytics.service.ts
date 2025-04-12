import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Order } from '../orders/entities/order.model';
import { User } from '../users/entities/user.model';
import { Category } from '../categories/entities/category.model';
import { Product } from '../products/entities/product.model';
import { Role } from '../auth/enums/roles.enum';
import { Op } from 'sequelize';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(User) private readonly userModel: typeof User,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Product) private readonly productModel: typeof Product,
    ) {}

    async getOrdersCountByTimeRange(
        startDate: Date,
        endDate: Date,
    ): Promise<number> {
        try {
            const count = await this.orderModel.count({
                where: {
                    time: {
                        [Op.between]: [startDate, endDate],
                    },
                },
            });

            return count;
        } catch (error) {
            this.logger.error(`Error counting orders: ${error.message}`);
            throw new Error('Failed to count orders by time range');
        }
    }

    async getCategoriesCount(): Promise<number> {
        try {
            return await this.categoryModel.count();
        } catch (error) {
            this.logger.error(`Error counting categories: ${error.message}`);
            throw new Error('Failed to count categories');
        }
    }

    async getUsersCountByRole(role: Role): Promise<number> {
        try {
            return await this.userModel.count({
                where: { role },
            });
        } catch (error) {
            this.logger.error(`Error counting users by role: ${error.message}`);
            throw new Error(`Failed to count users with role ${role}`);
        }
    }

    async getProductsCount(): Promise<number> {
        try {
            return await this.productModel.count();
        } catch (error) {
            this.logger.error(`Error counting products: ${error.message}`);
            throw new Error('Failed to count products');
        }
    }

    async getDashboardStats(startDate: Date, endDate: Date): Promise<any> {
        try {
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
                `Error getting dashboard stats: ${error.message}`,
            );
            throw new Error('Failed to get dashboard statistics');
        }
    }
}
