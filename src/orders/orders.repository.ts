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
            time: Date;
            employeeName: string;
            paymentMethod: string;
            price: number;
        }[]
    > {
        const orders = await this.orderModel.findAll();
        const newOrders = orders.map((order: Order) => {
            return {
                id: order.dataValues.id,
                time: order.dataValues.time,
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
}
