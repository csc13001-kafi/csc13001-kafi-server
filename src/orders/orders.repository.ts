import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
    CreateOrderDetailsDto,
    CreateOrderGeneralDto,
} from './dtos/create-order.dto';
import { Order } from './entities/order.model';
import { OrderDetails } from './entities/order_details.model';
import { Product } from '../products/entities/product.model';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
@Injectable()
export class OrdersRepository {
    constructor(
        @InjectModel(Order) private readonly orderModel: typeof Order,
        @InjectModel(OrderDetails)
        private readonly orderDetailsModel: typeof OrderDetails,
    ) {}

    async create(
        orderDto: CreateOrderGeneralDto,
        orderDetails: CreateOrderDetailsDto,
    ): Promise<Order> {
        try {
            const {
                table,
                id,
                time,
                products,
                quantities,
                clientPhoneNumber,
                paymentMethod,
            } = orderDto;

            const {
                numberOfProducts,
                totalPrice,
                discountPercentage,
                discount,
                afterDiscountPrice,
                employeeName,
            } = orderDetails;

            const order = await this.orderModel.create({
                id: id,
                table: table,
                employeeName: employeeName,
                time: time,
                clientPhoneNumber: clientPhoneNumber,
                paymentMethod: paymentMethod,
                numberOfProducts: numberOfProducts,
                totalPrice: totalPrice,
                discountPercentage: discountPercentage,
                discount: discount,
                afterDiscountPrice: afterDiscountPrice,
            });

            if (
                products &&
                quantities &&
                products.length === quantities.length
            ) {
                const productIds = products.map(
                    (product: Product) => product.dataValues.id,
                );
                const orderDetailsData = products.map(
                    (product: Product, index: number) => {
                        return {
                            id: uuidv4(),
                            orderId: id,
                            productId: productIds[index],
                            price: product.dataValues.price,
                            quantity: quantities[index],
                        };
                    },
                );
                // Use bulkCreate to insert multiple records at once.
                await this.orderDetailsModel.bulkCreate(orderDetailsData);
            }

            return order;
        } catch (error: any) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async findAll(): Promise<
        {
            id: string;
            time: string;
            employeeName: string;
            paymentMethod: string;
            price: number;
        }[]
    > {
        const orders = await this.orderModel.findAll();
        const newOrders = orders.map((order: Order) => {
            const date = new Date(order.dataValues.time);
            date.setHours(date.getHours() + 7);
            const result = date.toISOString().replace('Z', '+07:00');
            return {
                id: order.dataValues.id,
                time: result,
                employeeName: order.dataValues.employeeName,
                paymentMethod: order.dataValues.paymentMethod,
                price: order.dataValues.afterDiscountPrice,
            };
        });
        return newOrders;
    }

    async findById(
        id: string,
        products: Product[],
    ): Promise<{
        id: string;
        employeeName: string;
        clientPhoneNumber: string;
        table: string;
        time: Date;
        numberOfProducts: number;
        totalPrice: number;
        discountPercentage: number;
        discount: number;
        afterDiscountPrice: number;
        paymentMethod: string;
        orderDetails: {
            productName: string;
            price: number;
            quantity: number;
        }[];
    }> {
        const orderGeneral = await this.orderModel.findByPk(id);
        const orderDetails = await this.orderDetailsModel.findAll({
            where: {
                orderId: id,
            },
        });
        const newOrderDetails = orderDetails.map(
            (orderDetail: OrderDetails) => {
                return {
                    productName: products.find(
                        (product: Product) =>
                            product.id === orderDetail.dataValues.productId,
                    )?.name,
                    price: orderDetail.dataValues.price,
                    quantity: orderDetail.dataValues.quantity,
                };
            },
        );
        const order = {
            id: orderGeneral.id,
            employeeName: orderGeneral.dataValues.employeeName,
            clientPhoneNumber: orderGeneral.dataValues.clientPhoneNumber,
            table: orderGeneral.dataValues.table,
            time: orderGeneral.dataValues.time,
            numberOfProducts: orderGeneral.dataValues.numberOfProducts,
            totalPrice: orderGeneral.dataValues.totalPrice,
            discountPercentage: orderGeneral.dataValues.discountPercentage,
            discount: orderGeneral.dataValues.discount,
            afterDiscountPrice: orderGeneral.dataValues.afterDiscountPrice,
            paymentMethod: orderGeneral.dataValues.paymentMethod,
            orderDetails: newOrderDetails,
        };
        return order;
    }

    async countByTimeRange(startDate: Date, endDate: Date): Promise<number> {
        const count = await this.orderModel.count({
            where: {
                time: {
                    [Op.between]: [startDate, endDate],
                },
            },
        });
        return count;
    }

    async getTotalPriceByTimeRange(
        startDate: Date,
        endDate: Date,
    ): Promise<number> {
        const totalPrice = await this.orderModel.sum('afterDiscountPrice', {
            where: { time: { [Op.between]: [startDate, endDate] } },
        });
        return totalPrice;
    }

    async getHourlySalesData(
        date: Date,
    ): Promise<{ hour: number; totalPrice: number }[]> {
        try {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const orders = await this.orderModel.findAll({
                attributes: ['time', 'afterDiscountPrice'],
                where: {
                    time: {
                        [Op.between]: [startDate, endDate],
                    },
                },
                raw: true,
            });

            const hourlySales = {};
            const openHours = 0;
            const closeHours = 23;
            for (let hour = openHours; hour <= closeHours; hour++) {
                hourlySales[hour] = 0;
            }

            orders.forEach((order) => {
                const orderTime = new Date(order.time);
                const hour = orderTime.getHours();

                if (hour >= openHours && hour <= closeHours) {
                    hourlySales[hour] += Number(order.afterDiscountPrice);
                }
            });

            const result = Object.entries(hourlySales).map(
                ([hour, totalPrice]) => ({
                    hour: parseInt(hour),
                    totalPrice: Number(totalPrice),
                }),
            );

            return result;
        } catch (error: any) {
            throw new InternalServerErrorException(
                `Failed to get hourly sales: ${error.message}`,
            );
        }
    }

    async getTopSellingProducts(
        limit: number = 10,
        startDate?: Date,
        endDate?: Date,
    ): Promise<{ productId: string; quantity: number }[]> {
        try {
            const whereClause: any = {};
            if (startDate && endDate) {
                whereClause.time = {
                    [Op.between]: [startDate, endDate],
                };
            }

            const orders = await this.orderModel.findAll({
                attributes: ['id'],
                where: whereClause,
                raw: true,
            });

            const orderIds = orders.map((order) => order.id);

            if (orderIds.length === 0) {
                return [];
            }

            const orderDetails = await this.orderDetailsModel.findAll({
                attributes: [
                    'productId',
                    [
                        this.orderDetailsModel.sequelize.fn(
                            'SUM',
                            this.orderDetailsModel.sequelize.col('quantity'),
                        ),
                        'totalQuantity',
                    ],
                ],
                where: {
                    orderId: {
                        [Op.in]: orderIds,
                    },
                },
                group: ['productId'],
                order: [
                    [
                        this.orderDetailsModel.sequelize.fn(
                            'SUM',
                            this.orderDetailsModel.sequelize.col('quantity'),
                        ),
                        'DESC',
                    ],
                ],
                limit: limit,
                raw: true,
            });

            return orderDetails;
        } catch (error: any) {
            throw new InternalServerErrorException(
                `Failed to get top selling products: ${error.message}`,
            );
        }
    }

    async getOrderCountsByDayAndPaymentMethod(
        month: number,
        year: number,
    ): Promise<{ day: number; cash: number; qr: number }[]> {
        try {
            const daysToCheck = Array.from({ length: 31 }, (_, i) => i + 1);
            const lastDayOfMonth = new Date(year, month, 0).getDate();

            const validDays = daysToCheck.filter(
                (day) => day <= lastDayOfMonth,
            );

            const result: { day: number; cash: number; qr: number }[] = [];

            for (const day of validDays) {
                const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
                const endOfDay = new Date(
                    year,
                    month - 1,
                    day,
                    23,
                    59,
                    59,
                    999,
                );

                // Get cash orders count
                const cashCount = await this.orderModel.count({
                    where: {
                        time: { [Op.between]: [startOfDay, endOfDay] },
                        paymentMethod: 'Cash',
                    },
                });

                // Get QR/online payment orders count
                const qrCount = await this.orderModel.count({
                    where: {
                        time: { [Op.between]: [startOfDay, endOfDay] },
                        paymentMethod: 'QR',
                    },
                });

                // Add to result array
                result.push({
                    day,
                    cash: cashCount,
                    qr: qrCount,
                });
            }

            return result;
        } catch (error: any) {
            throw new InternalServerErrorException(
                `Failed to get order counts by day and payment method: ${error.message}`,
            );
        }
    }
}
