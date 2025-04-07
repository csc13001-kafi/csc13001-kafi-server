import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ProductsRepository } from '../products/products.repository';
import { UsersRepository } from '../users/users.repository';
import { OrdersRepository } from './orders.repository';
import { Product } from 'src/products/entities/product.model';
import { PayOSService } from '../payment/payos.service';
import { PaymentMethod } from './enums/payment-method.enum';

@Injectable()
export class OrdersService {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly productsRepository: ProductsRepository,
        private readonly usersRepository: UsersRepository,
        private readonly payosService: PayOSService,
    ) {}

    calculateDiscount(
        loyaltyPoints: number,
        totalPrice: number,
    ): {
        afterDiscountPrice: number;
        discountPercentage: number;
    } {
        const platinumDiscount: number = 15;
        const goldDiscount: number = 10;
        const silverDiscount: number = 5;
        if (loyaltyPoints >= 5000) {
            return {
                afterDiscountPrice:
                    totalPrice * ((100 - platinumDiscount) / 100),
                discountPercentage: platinumDiscount,
            };
        } else if (loyaltyPoints >= 2000) {
            return {
                afterDiscountPrice: totalPrice * ((100 - goldDiscount) / 100),
                discountPercentage: goldDiscount,
            };
        } else if (loyaltyPoints >= 1000) {
            return {
                afterDiscountPrice: totalPrice * ((100 - silverDiscount) / 100),
                discountPercentage: silverDiscount,
            };
        }
        return {
            afterDiscountPrice: totalPrice,
            discountPercentage: 0,
        };
    }

    async checkoutOrder(employeeId: string, orderDto: CreateOrderDto) {
        const numberOfProducts = orderDto.products.length;
        let totalPrice = 0;
        for (let i = 0; i < numberOfProducts; i++) {
            const product = await this.productsRepository.findById(
                orderDto.products[i],
            );
            totalPrice = totalPrice + product.price * orderDto.quantities[i];
        }

        const client = await this.usersRepository.findOneByPhoneNumber(
            orderDto.clientPhoneNumber,
        );

        if (!client) {
            throw new BadRequestException('Client not found');
        }

        try {
            const employee = await this.usersRepository.findOneById(employeeId);
            const loyaltyPoints = client.loyaltyPoints;
            const { afterDiscountPrice, discountPercentage } =
                this.calculateDiscount(loyaltyPoints, totalPrice);
            const discount = totalPrice - afterDiscountPrice;

            if (orderDto.paymentMethod === PaymentMethod.QR) {
                const orderCode = `KAFI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const paymentLink = await this.payosService.createPaymentLink({
                    orderCode,
                    amount: Math.round(afterDiscountPrice), // PayOS expects amount in VND with no decimals
                    description: `Payment for order ${orderCode}`,
                    cancelUrl: `${process.env.FRONTEND_URL}/orders/cancel`,
                    returnUrl: `${process.env.FRONTEND_URL}/orders/success`,
                });

                const orderDetails = {
                    numberOfProducts,
                    totalPrice,
                    discountPercentage,
                    discount,
                    afterDiscountPrice,
                    employeeName: employee.username,
                    paymentStatus: 'PENDING',
                    paymentLink: paymentLink.checkoutUrl,
                    orderCode,
                };

                const products: Product[] = await Promise.all(
                    orderDto.products.map(async (productId) =>
                        this.productsRepository.findById(productId),
                    ),
                );

                const orderGeneralDto = {
                    ...orderDto,
                    products: products,
                };

                const order = await this.ordersRepository.create(
                    orderGeneralDto,
                    orderDetails,
                );

                return {
                    ...order,
                    paymentLink: paymentLink.checkoutUrl,
                };
            } else {
                const orderDetails = {
                    numberOfProducts,
                    totalPrice,
                    discountPercentage,
                    discount,
                    afterDiscountPrice,
                    employeeName: employee.username,
                };

                const products: Product[] = await Promise.all(
                    orderDto.products.map(async (productId) =>
                        this.productsRepository.findById(productId),
                    ),
                );

                const orderGeneralDto = {
                    ...orderDto,
                    products: products,
                };

                const order = await this.ordersRepository.create(
                    orderGeneralDto,
                    orderDetails,
                );

                return order;
            }
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getAllOrders(): Promise<
        {
            id: string;
            time: Date;
            employeeName: string;
            paymentMethod: string;
            price: number;
        }[]
    > {
        return this.ordersRepository.findAll();
    }

    async getOrderById(id: string) {
        const products = await this.productsRepository.findAll();
        return this.ordersRepository.findById(id, products);
    }
}
