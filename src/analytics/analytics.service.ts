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

    async getOrdersByMonth(month: number): Promise<any> {
        try {
            if (month < 1 || month > 12) {
                throw new Error('Month must be between 1 and 12');
            }

            const currentYear = new Date().getFullYear();

            const startDate = new Date(currentYear, month - 1, 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(currentYear, month, 0);
            endDate.setHours(23, 59, 59, 999);

            const [ordersCount, ordersTotalPrice] = await Promise.all([
                this.getOrdersCountByTimeRange(startDate, endDate),
                this.getOrdersTotalPriceByTimeRange(startDate, endDate),
            ]);

            const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
            const localStartDate = new Date(
                startDate.getTime() - timeZoneOffset,
            );
            const localEndDate = new Date(endDate.getTime() - timeZoneOffset);

            return {
                month: month,
                monthName: startDate.toLocaleString('en-US', { month: 'long' }),
                ordersCount,
                ordersTotalPrice,
                timeRange: {
                    startDate: localStartDate,
                    endDate: localEndDate,
                },
            };
        } catch (error: any) {
            throw new Error(`Failed to get orders by month: ${error.message}`);
        }
    }

    async getHourlySalesData(dateStr: string): Promise<any> {
        try {
            const date = new Date(dateStr);

            if (isNaN(date.getTime())) {
                throw new Error(
                    'Invalid date format. Please use YYYY-MM-DD format.',
                );
            }

            const hourlySalesData =
                await this.ordersRepository.getHourlySalesData(date);

            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            return {
                date: formattedDate,
                rawDate: date.toISOString().split('T')[0],
                hourlySales: hourlySalesData,
            };
        } catch (error: any) {
            throw new Error(
                `Failed to get hourly sales data: ${error.message}`,
            );
        }
    }

    async getTopSellingProducts(
        limit: number = 10,
        startDateStr?: string,
        endDateStr?: string,
    ): Promise<any> {
        try {
            let startDate: Date | undefined;
            let endDate: Date | undefined;

            if (startDateStr && endDateStr) {
                startDate = new Date(startDateStr);
                endDate = new Date(endDateStr);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    throw new Error(
                        'Invalid date format. Please use YYYY-MM-DD format.',
                    );
                }

                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

                const currentYear = new Date().getFullYear();
                if (startDate.getFullYear() !== currentYear) {
                    startDate.setFullYear(currentYear);
                }
                if (endDate.getFullYear() !== currentYear) {
                    endDate.setFullYear(currentYear);
                }
            }

            const topProducts: {
                productId: string;
                quantity: number;
                productName?: string;
            }[] = await this.ordersRepository.getTopSellingProducts(
                limit,
                startDate,
                endDate,
            );

            if (topProducts.length > 0) {
                const products = await this.productsRepository.findAll();
                for (const product of topProducts) {
                    const matchingProduct = products.find(
                        (p) => p.id === product.productId,
                    );
                    product.productName = matchingProduct.name;
                    delete product.productId;
                }
                return {
                    timeRange:
                        startDate && endDate
                            ? {
                                  startDate: startDate.toLocaleDateString(),
                                  endDate: endDate.toLocaleDateString(),
                              }
                            : 'All time',
                    topProducts: topProducts,
                };
            }

            return {
                timeRange:
                    startDate && endDate
                        ? {
                              startDate: startDate.toLocaleDateString(),
                              endDate: endDate.toLocaleDateString(),
                          }
                        : 'All time',
                topProducts: [],
            };
        } catch (error: any) {
            throw new Error(
                `Failed to get top selling products: ${error.message}`,
            );
        }
    }

    async getOrdersByDayAndPaymentMethod(month: number): Promise<any> {
        try {
            // Validate month input
            if (month < 1 || month > 12) {
                throw new Error('Month must be between 1 and 12');
            }

            // Use current year
            const currentYear = new Date().getFullYear();

            // Get data from repository
            const dayStats =
                await this.ordersRepository.getOrderCountsByDayAndPaymentMethod(
                    month,
                    currentYear,
                );

            // Get month name for display
            const monthName = new Date(
                currentYear,
                month - 1,
                1,
            ).toLocaleString('en-US', { month: 'long' });

            // Calculate totals
            let totalCash = 0;
            let totalQr = 0;

            dayStats.forEach((stat) => {
                totalCash += stat.cash;
                totalQr += stat.qr;
            });

            return {
                month,
                monthName,
                year: currentYear,
                days: dayStats,
                summary: {
                    totalCash,
                    totalQr,
                    total: totalCash + totalQr,
                    cashPercentage:
                        totalCash + totalQr > 0
                            ? Math.round(
                                  (totalCash / (totalCash + totalQr)) * 100,
                              )
                            : 0,
                    qrPercentage:
                        totalCash + totalQr > 0
                            ? Math.round(
                                  (totalQr / (totalCash + totalQr)) * 100,
                              )
                            : 0,
                },
            };
        } catch (error: any) {
            throw new Error(
                `Failed to get orders by day and payment method: ${error.message}`,
            );
        }
    }
}
