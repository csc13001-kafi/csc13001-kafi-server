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
    private orderCache: Map<string, any> = new Map();

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
        try {
            const numberOfProducts = orderDto.products.length;
            let totalPrice = 0;
            for (let i = 0; i < numberOfProducts; i++) {
                const product = await this.productsRepository.findById(
                    orderDto.products[i],
                );
                totalPrice =
                    totalPrice +
                    product.dataValues.price * orderDto.quantities[i];
            }

            const client = await this.usersRepository.findOneByPhoneNumber(
                orderDto.clientPhoneNumber,
            );

            if (!client) {
                throw new BadRequestException('Client not found');
            }

            const employee = await this.usersRepository.findOneById(employeeId);
            const loyaltyPoints = client.loyaltyPoints;
            const { afterDiscountPrice, discountPercentage } =
                this.calculateDiscount(loyaltyPoints, totalPrice);
            const discount = totalPrice - afterDiscountPrice;

            if (orderDto.paymentMethod === PaymentMethod.QR) {
                // For QR payment, we create a payment request first
                const orderCode = Math.floor(Math.random() * 100000);

                const paymentResponse =
                    await this.payosService.createPaymentLink({
                        orderCode: orderCode,
                        amount: Math.round(afterDiscountPrice),
                        description: `Payment for order ${orderCode}`,
                        phoneNumber: orderDto.clientPhoneNumber,
                        cancelUrl: 'https://kafi-app.com/cancel',
                        returnUrl: 'https://kafi-app.com/success',
                    });

                if (!paymentResponse) {
                    throw new BadRequestException('Payment failed');
                }

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
                const orderGeneralDto = { ...orderDto, products: products };

                // Store the order data in cache for later retrieval
                this.cacheOrderData(orderCode.toString(), {
                    orderDetails,
                    orderGeneralDto,
                });

                return {
                    order: {
                        orderDetails,
                        orderGeneralDto,
                    },
                    paymentLink:
                        paymentResponse.paymentResponse?.data?.checkoutUrl,
                    qrLink: paymentResponse.qrLink,
                    orderCode: orderCode,
                    message:
                        'Payment pending. Scan QR code to pay and check payment status.',
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

    async completeOrder(
        orderDetails: {
            numberOfProducts: number;
            totalPrice: number;
            discountPercentage: number;
            discount: number;
            afterDiscountPrice: number;
            employeeName: string;
        },
        orderGeneralDto: {
            products: Product[];
            table: string;
            id: string;
            time: string;
            quantities: number[];
            clientPhoneNumber: string;
            paymentMethod: PaymentMethod;
        },
    ) {
        try {
            const order = await this.ordersRepository.create(
                orderGeneralDto,
                orderDetails,
            );

            return order;
        } catch (error: any) {
            console.error('Error completing order:', error);
            throw new Error(`Failed to complete order: ${error.message}`);
        }
    }

    async checkPaymentStatus(orderCode: string | number) {
        try {
            // Check payment status with PayOS
            const paymentStatus =
                await this.payosService.checkPaymentStatus(orderCode);

            console.log('Payment status:', paymentStatus);

            // If payment is completed, create the order in the database
            if (paymentStatus.rawData.data.status == 'PAID') {
                // Find if we have cached order data for this orderCode
                const cachedOrderData = this.findCachedOrderData(orderCode);

                if (cachedOrderData) {
                    // Create the order in the database using cached data
                    await this.completeOrder(
                        cachedOrderData.orderDetails,
                        cachedOrderData.orderGeneralDto,
                    );

                    return {
                        ...paymentStatus,
                        orderCreated: true,
                        message: 'Payment successful and order created',
                    };
                } else {
                    // Payment successful but we don't have order details cached
                    return {
                        ...paymentStatus,
                        orderCreated: false,
                        message:
                            'Payment successful but order details not found. Please submit order details.',
                    };
                }
            }

            // Payment is not completed yet, just return status
            return {
                ...paymentStatus,
                orderCreated: false,
                message: 'Payment not completed yet',
            };
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw new InternalServerErrorException(
                `Failed to check payment status: ${error.message}`,
            );
        }
    }

    private findCachedOrderData(orderCode: string | number): any {
        const key = orderCode.toString();
        if (this.orderCache.has(key)) {
            return this.orderCache.get(key);
        }
        return null;
    }

    private cacheOrderData(orderCode: string, orderData: any) {
        this.orderCache.set(orderCode, orderData);
    }
}
