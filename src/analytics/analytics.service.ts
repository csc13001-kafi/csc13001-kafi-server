import { Injectable, Logger } from '@nestjs/common';
import { Role } from '../auth/enums/roles.enum';
import { OrdersRepository } from 'src/orders/orders.repository';
import { UsersRepository } from 'src/users/users.repository';
import { ProductsRepository } from 'src/products/products.repository';
import { CategoriesRepository } from 'src/categories/categories.repository';
import { Product } from 'src/products/entities/product.model';
import { MaterialsRepository } from 'src/materials/materials.repository';
import { TimeRangeOption } from './dtos/time-range.dto';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly usersRepository: UsersRepository,
        private readonly productsRepository: ProductsRepository,
        private readonly categoriesRepository: CategoriesRepository,
        private readonly materialsRepository: MaterialsRepository,
    ) {}

    calculateTimeRange(timeRangeOption: TimeRangeOption): {
        startDate: Date;
        endDate: Date;
    } {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (timeRangeOption) {
            case TimeRangeOption.TODAY:
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case TimeRangeOption.THIS_WEEK:
                const dayOfWeek = now.getDay();
                // Adjust to Monday as first day of week
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startDate = new Date(now);
                startDate.setDate(now.getDate() - diffToMonday);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case TimeRangeOption.THIS_MONTH:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case TimeRangeOption.THREE_MONTHS:
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case TimeRangeOption.SIX_MONTHS:
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                endDate.setHours(23, 59, 59, 999);
                break;
            case TimeRangeOption.THIS_YEAR:
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
            default:
                throw new Error('Invalid time range option');
        }

        return { startDate, endDate };
    }

    async getDashboardStatsByTimeRange(
        timeRangeOption: TimeRangeOption,
    ): Promise<any> {
        const { startDate, endDate } = this.calculateTimeRange(timeRangeOption);
        return this.getDashboardStats(startDate, endDate);
    }

    async getOrdersCountByTimeRange(
        startDate: Date,
        endDate: Date,
    ): Promise<number> {
        try {
            const count = await this.ordersRepository.countByTimeRange(
                startDate,
                endDate,
            );
            return count || 0;
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
            const totalPrice =
                await this.ordersRepository.getTotalPriceByTimeRange(
                    startDate,
                    endDate,
                );
            return totalPrice || 0;
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
            const count = await this.categoriesRepository.countCategories();
            return count || 0;
        } catch (error) {
            this.logger.error(
                `Error in categories count service: ${error.message}`,
            );
            throw new Error('Failed to get categories count');
        }
    }

    async getUsersCountByRole(role: Role): Promise<number> {
        try {
            const count = await this.usersRepository.countByRole(role);
            return count || 0;
        } catch (error) {
            this.logger.error(`Error in users count service: ${error.message}`);
            throw new Error(`Failed to get users count with role ${role}`);
        }
    }

    async getProductsCount(): Promise<number> {
        try {
            const count = await this.productsRepository.countProducts();
            return count || 0;
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

            // Calculate time difference to determine the previous period
            const timeDiff = localEndDate.getTime() - localStartDate.getTime();

            // Calculate previous period dates
            const prevEndDate = new Date(localStartDate.getTime());
            const prevStartDate = new Date(prevEndDate.getTime() - timeDiff);

            // Get current period data
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

            // Get previous period data
            const [prevOrdersCount, prevOrdersTotalPrice] = await Promise.all([
                this.getOrdersCountByTimeRange(prevStartDate, prevEndDate),
                this.getOrdersTotalPriceByTimeRange(prevStartDate, prevEndDate),
            ]);

            // Calculate percentage changes
            const calculatePercentChange = (
                current: number,
                previous: number,
            ): number => {
                if (previous === 0) return current > 0 ? 100 : 0;
                const percentChange = ((current - previous) / previous) * 100;
                return isNaN(percentChange)
                    ? 0
                    : Number(percentChange.toFixed(2));
            };

            const ordersPercentChange = calculatePercentChange(
                ordersCount || 0,
                prevOrdersCount || 0,
            );
            const revenuePercentChange = calculatePercentChange(
                ordersTotalPrice || 0,
                prevOrdersTotalPrice || 0,
            );

            const timeZoneOffset = new Date().getTimezoneOffset() * 60000;
            const localStartDateFormatted = new Date(
                localStartDate.getTime() - timeZoneOffset,
            );
            const localEndDateFormatted = new Date(
                localEndDate.getTime() - timeZoneOffset,
            );

            // Get human-readable time range name
            const timeRangeName = this.getTimeRangeName(
                localStartDate,
                localEndDate,
            );

            return {
                Overview: {
                    ordersCount: ordersCount || 0,
                    ordersPercentChange: ordersPercentChange || 0,
                    ordersTotalPrice: ordersTotalPrice || 0,
                    revenuePercentChange: revenuePercentChange || 0,
                },
                Product: {
                    categoriesCount: categoriesCount || 0,
                    productsCount: productsCount || 0,
                },
                Membership: customersCount || 0,
                timeRange: {
                    name: timeRangeName,
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

    // Helper method to get time range name
    private getTimeRangeName(startDate: Date, endDate: Date): string {
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        // Check for today
        if (
            startDate.getTime() === todayStart.getTime() &&
            endDate.getTime() === todayEnd.getTime()
        ) {
            return 'Today';
        }

        // Check for this week
        const weekStart = new Date(now);
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(now.getDate() - diffToMonday);
        weekStart.setHours(0, 0, 0, 0);
        if (
            startDate.getTime() === weekStart.getTime() &&
            endDate.getTime() <= todayEnd.getTime()
        ) {
            return 'This Week';
        }

        // Check for this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        if (
            startDate.getTime() === monthStart.getTime() &&
            endDate.getTime() === monthEnd.getTime()
        ) {
            return 'This Month';
        }

        // Check for this year
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        if (
            startDate.getTime() === yearStart.getTime() &&
            endDate.getTime() === yearEnd.getTime()
        ) {
            return 'This Year';
        }

        // Check for 3 months
        const threeMonthsAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1,
        );
        if (startDate.getTime() === threeMonthsAgo.getTime()) {
            return 'Last 3 Months';
        }

        // Check for 6 months
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (startDate.getTime() === sixMonthsAgo.getTime()) {
            return 'Last 6 Months';
        }

        // Otherwise return custom range
        return 'Custom Range';
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
                ordersCount: ordersCount || 0,
                ordersTotalPrice: ordersTotalPrice || 0,
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
                totalCash += stat.cash || 0;
                totalQr += stat.qr || 0;
            });

            return {
                month,
                monthName,
                year: currentYear,
                days: dayStats.map((stat) => ({
                    ...stat,
                    cash: stat.cash || 0,
                    qr: stat.qr || 0,
                    total: (stat.cash || 0) + (stat.qr || 0),
                })),
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

    async getLowStockMaterials(limit: number = 3): Promise<any> {
        try {
            const materials =
                await this.materialsRepository.findLowestStock(limit);

            return {
                materials: materials.map((material) => ({
                    name: material.name,
                    currentStock: material.currentStock || 0,
                    originalStock: material.orginalStock || 0,
                    unit: material.unit,
                    percentRemaining:
                        Math.round(
                            ((material.currentStock || 0) /
                                (material.orginalStock || 1)) *
                                100,
                        ) || 0,
                    expiredDate: material.expiredDate,
                })),
            };
        } catch (error: any) {
            throw new Error(
                `Failed to get low stock materials: ${error.message}`,
            );
        }
    }
}
