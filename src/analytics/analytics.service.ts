import { Injectable, Logger } from '@nestjs/common';
import { Role } from '../auth/enums/roles.enum';
import { OrdersRepository } from 'src/orders/orders.repository';
import { UsersRepository } from 'src/users/users.repository';
import { ProductsRepository } from 'src/products/products.repository';
import { CategoriesRepository } from 'src/categories/categories.repository';
import { Product } from 'src/products/entities/product.model';
import { MaterialsRepository } from 'src/materials/materials.repository';
import { TimeRangeOption } from './dtos/time-range.dto';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);
    private openai: OpenAI;

    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly usersRepository: UsersRepository,
        private readonly productsRepository: ProductsRepository,
        private readonly categoriesRepository: CategoriesRepository,
        private readonly materialsRepository: MaterialsRepository,
        private readonly configService: ConfigService,
    ) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

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
            case TimeRangeOption.THIS_WEEK: {
                const dayOfWeek = now.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startDate = new Date(now);
                startDate.setDate(now.getDate() - diffToMonday);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            }
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
            throw new Error(`Failed to get users count with role EMPLOYEE`);
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
            const localStartDate = startDate;
            const localEndDate = endDate;
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
            return 'Hôm nay';
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
            return 'Tuần này';
        }

        // Check for this month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        if (
            startDate.getTime() === monthStart.getTime() &&
            endDate.getTime() === monthEnd.getTime()
        ) {
            return 'Tháng này';
        }

        // Check for this year
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        yearEnd.setHours(23, 59, 59, 999);
        if (
            startDate.getTime() === yearStart.getTime() &&
            endDate.getTime() === yearEnd.getTime()
        ) {
            return 'Năm này';
        }

        // Check for 3 months
        const threeMonthsAgo = new Date(
            now.getFullYear(),
            now.getMonth() - 2,
            1,
        );
        if (startDate.getTime() === threeMonthsAgo.getTime()) {
            return '3 tháng trước';
        }

        // Check for 6 months
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        if (startDate.getTime() === sixMonthsAgo.getTime()) {
            return '6 tháng trước';
        }

        // Otherwise return custom range
        return 'Khoảng thời gian tùy chọn';
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
                totalQuantity?: number;
                productName?: string;
                revenue?: number;
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
                    product.revenue =
                        product.totalQuantity * matchingProduct.price;
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

    async generateBusinessReport(
        timeRangeOption: TimeRangeOption,
    ): Promise<string> {
        try {
            const { startDate, endDate } =
                this.calculateTimeRange(timeRangeOption);
            const timeRangeName = this.getTimeRangeName(startDate, endDate);
            // Get analytics data for the report
            const dashboardStats = await this.getDashboardStats(
                startDate,
                endDate,
            );
            const topProductsData = await this.getTopSellingProducts(5);

            // Get previous period data for comparison
            const timeDiff = endDate.getTime() - startDate.getTime();
            const prevEndDate = new Date(startDate.getTime());
            const prevStartDate = new Date(prevEndDate.getTime() - timeDiff);
            const prevStats = await this.getDashboardStats(
                prevStartDate,
                prevEndDate,
            );

            // Calculate growth rates
            const prevOrderCount = prevStats.Overview.ordersCount
                ? prevStats.Overview.ordersCount
                : 1;
            const orderGrowthValue =
                dashboardStats.Overview.ordersCount > 0
                    ? ((dashboardStats.Overview.ordersCount - prevOrderCount) /
                          prevOrderCount) *
                      100
                    : 0;

            const orderGrowth = orderGrowthValue.toFixed(2);

            const prevTotalPrice = prevStats.Overview.ordersTotalPrice
                ? prevStats.Overview.ordersTotalPrice
                : 1;
            const revenueGrowthValue =
                dashboardStats.Overview.ordersTotalPrice > 0 &&
                prevTotalPrice > 0
                    ? ((dashboardStats.Overview.ordersTotalPrice -
                          prevTotalPrice) /
                          prevTotalPrice) *
                      100
                    : 0;
            const revenueGrowth = revenueGrowthValue.toFixed(2);

            // Calculate gross profit (assuming 70% margin for coffee shop)
            const grossProfit = dashboardStats.Overview.ordersTotalPrice * 0.7;
            const grossProfitMargin = (
                (grossProfit / dashboardStats.Overview.ordersTotalPrice) *
                100
            ).toFixed(2);

            // Calculate operating costs (assumed 40% of revenue for coffee shop)
            const operatingCosts =
                dashboardStats.Overview.ordersTotalPrice * 0.4;

            const reportData = {
                timeRange: timeRangeName,
                ordersCount: dashboardStats.Overview.ordersCount || 0,
                ordersTotalPrice: dashboardStats.Overview.ordersTotalPrice || 0,
                orderGrowth: orderGrowth,
                revenueGrowth: revenueGrowth,
                grossProfitMargin: grossProfitMargin,
                operatingCosts: operatingCosts.toFixed(0),
                monthlyGrowthRate: (revenueGrowthValue / 3).toFixed(2), // Assuming quarterly data
                topProducts: topProductsData?.topProducts || [],
                categoriesCount: dashboardStats.Product.categoriesCount || 0,
                productsCount: dashboardStats.Product.productsCount || 0,
            };

            // Create OpenAI prompt based on the template
            console.log(reportData);
            const prompt = this.createBusinessReportPrompt(reportData);

            // Generate the report with OpenAI
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a professional business analyst for Kafi coffee shop. Your job is to analyze data and produce insightful business reports in Vietnamese.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.7,
            });

            return completion.choices[0].message.content;
        } catch (error) {
            this.logger.error(
                `Error generating business report: ${error.message}`,
            );
            throw new Error(
                `Failed to generate business report: ${error.message}`,
            );
        }
    }

    private createBusinessReportPrompt(data: any): string {
        const reportData = {
            timeRange: data.timeRange || 'Không xác định',
            ordersTotalPrice: data.ordersTotalPrice || 0,
            revenueGrowth: data.revenueGrowth || '0',
            ordersCount: data.ordersCount || 0,
            orderGrowth: data.orderGrowth || '0',
            grossProfitMargin: data.grossProfitMargin || '0',
            operatingCosts: data.operatingCosts || '0',
            monthlyGrowthRate: data.monthlyGrowthRate || '0',
            topProducts: Array.isArray(data.topProducts)
                ? data.topProducts
                : [],
            customersCount: data.customersCount || 0,
            employeesCount: data.employeesCount || 0,
            categoriesCount: data.categoriesCount || 0,
            productsCount: data.productsCount || 0,
        };

        // Format the top products list safely
        let topProductsList = '';
        if (
            Array.isArray(reportData.topProducts) &&
            reportData.topProducts.length > 0
        ) {
            topProductsList = reportData.topProducts
                .map((p, i) => {
                    const name = p.productName || 'Không tên';
                    const quantity = p.totalQuantity || 0;
                    const revenue = p.revenue || 0;
                    return `${i + 1}. ${name} - ${quantity} sản phẩm - ${revenue} VNĐ`;
                })
                .join('\n');
            console.log(topProductsList);
        } else {
            topProductsList = 'Không có dữ liệu sản phẩm';
        }
        return `
Tạo báo cáo đánh giá hiệu suất kinh doanh cho Kafi coffee shop với dữ liệu sau:

Tổng doanh thu: ${reportData.ordersTotalPrice.toLocaleString('vi-VN')} VNĐ
Tăng trưởng doanh thu: ${reportData.revenueGrowth}%
Số lượng đơn hàng: ${reportData.ordersCount}
Tăng trưởng đơn hàng: ${reportData.orderGrowth}%
Tỷ suất lợi nhuận gộp: ${reportData.grossProfitMargin}%
Chi phí vận hành: ${parseInt(reportData.operatingCosts)} VNĐ
Tăng trưởng trung bình theo tháng: ${reportData.monthlyGrowthRate}%

Top sản phẩm bán chạy:
${topProductsList}

Số lượng khách hàng: ${reportData.customersCount}
Số lượng nhân viên: ${reportData.employeesCount}
Số lượng danh mục: ${reportData.categoriesCount}
Số lượng sản phẩm: ${reportData.productsCount}

Hãy tạo một báo cáo đầy đủ theo mẫu sau (giữ nguyên định dạng và các tiêu đề, thay thế nội dung trong []):

BÁO CÁO ĐÁNH GIÁ HIỆU SUẤT KINH DOANH
Thời gian: ${reportData.timeRange}

1. Tổng quan doanh thu và lợi nhuận
Trong ${reportData.timeRange}, tổng doanh thu đạt ${reportData.ordersTotalPrice} VNĐ, với mức tăng/giảm ${reportData.revenueGrowth}% so với kỳ trước. Lợi nhuận ròng đạt ${reportData.grossProfitMargin}%
Tăng trưởng đơn hàng: ${reportData.orderGrowth}%
Tỷ suất lợi nhuận gộp: ${reportData.grossProfitMargin}%
Chi phí vận hành: ${reportData.operatingCosts} VNĐ
Tăng trưởng trung bình theo tháng: ${reportData.monthlyGrowthRate}%
2. Hiệu suất sản phẩm/dịch vụ
Các sản phẩm/dịch vụ có doanh thu cao nhất:
${reportData.topProducts.map((p, i) => `${i + 1}. ${p.name} – ${p.totalQuantity} sản phẩm – ${p.revenue} VNĐ`).join('\n')}
Sản phẩm/dịch vụ có mức tăng trưởng mạnh nhất: ${reportData.topProducts.map((p, i) => `${i + 1}. ${p.name} – ${p.totalQuantity} sản phẩm – ${p.revenue} VNĐ`).join('\n')}
Sản phẩm/dịch vụ có doanh thu giảm sút: ${reportData.topProducts.map((p, i) => `${i + 1}. ${p.name} – ${p.totalQuantity} sản phẩm – ${p.revenue} VNĐ`).join('\n')}

3. Đề xuất cải thiện với AI
Hãy đưa ra lời khuyên dựa trên số liệu bạn biết

Kết luận: Hệ thống ghi nhận [kết quả tốt/xu hướng giảm] trong hiệu suất kinh doanh. Cần có các điều chỉnh về [chiến lược giá, tiếp thị, quản lý khách hàng] để duy trì/tăng trưởng lợi nhuận.

`;
    }
}
