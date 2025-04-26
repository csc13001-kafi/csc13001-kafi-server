import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { CreateOrderDto } from './dtos/create-order.dto';
import { ProductsRepository } from '../products/products.repository';
import { UsersRepository } from '../users/users.repository';
import { OrdersRepository } from './orders.repository';
import { Product } from '../products/entities/product.model';
import { PayOSService } from '../payment/payos/payos.service';
import { PaymentMethod } from './enums/payment-method.enum';
import { MaterialsRepository } from '../materials/materials.repository';
@Injectable()
export class OrdersService {
    public orderCache: Map<string, any> = new Map();

    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly productsRepository: ProductsRepository,
        private readonly materialsRepository: MaterialsRepository,
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

    private async checkAndUpdateProductAvailability(products: Product[]) {
        for (let i = 0; i < products.length; i++) {
            const productId = products[i].id;

            const productMaterials =
                await this.productsRepository.findAllMaterialsOfProduct(
                    productId,
                );

            // Check if any material is now insufficient for future orders
            for (const material of productMaterials) {
                const materialId = material.materialId;
                const requiredQuantity = material.quantity;

                // Get current material stock
                const currentMaterial =
                    await this.materialsRepository.findById(materialId);
                const currentStock = currentMaterial.dataValues.currentStock;

                // If current stock is less than required quantity for one more order, product is out of stock
                if (currentStock < requiredQuantity) {
                    await this.productsRepository.updateAvailableStatus(
                        productId,
                        false,
                    );
                    console.log(
                        `Updated product ${productId} to out of stock - insufficient ${materialId}`,
                    );
                    break; // No need to check other materials for this product
                }
            }
        }
    }

    async checkoutOrder(employeeId: string, orderDto: CreateOrderDto) {
        const numberOfProducts = orderDto.products.length;
        let totalPrice = 0;
        for (let i = 0; i < numberOfProducts; i++) {
            const product = await this.productsRepository.findById(
                orderDto.products[i],
            );
            totalPrice =
                totalPrice + product.dataValues.price * orderDto.quantities[i];
        }
        const client = await this.usersRepository.findOneByPhoneNumber(
            orderDto.clientPhoneNumber,
        );
        let afterDiscountPrice = totalPrice;
        let discountPercentage = 0;
        let discount = 0;
        if (client) {
            const loyaltyPoints = client.loyaltyPoints;
            ({ afterDiscountPrice, discountPercentage } =
                this.calculateDiscount(loyaltyPoints, totalPrice));
            discount = totalPrice - afterDiscountPrice;
        }
        try {
            const employee = await this.usersRepository.findOneById(employeeId);
            if (orderDto.paymentMethod === PaymentMethod.QR) {
                // For QR payment, we create a payment request first
                const orderCode = Math.floor(Math.random() * 100000);
                const paymentDto: {
                    orderCode: number;
                    amount: number;
                    description: string;
                    phoneNumber?: string;
                    cancelUrl: string;
                    returnUrl: string;
                } = orderDto.clientPhoneNumber
                    ? {
                          orderCode: orderCode,
                          amount: Math.round(afterDiscountPrice),
                          description: `Payment for order ${orderCode}`,
                          phoneNumber: orderDto.clientPhoneNumber,
                          cancelUrl: 'https://kafi-app.com/cancel',
                          returnUrl: 'https://kafi-app.com/success',
                      }
                    : {
                          orderCode: orderCode,
                          amount: Math.round(totalPrice),
                          description: `Payment for order ${orderCode}`,
                          cancelUrl: 'https://kafi-app.com/cancel',
                          returnUrl: 'https://kafi-app.com/success',
                      };
                const paymentResponse =
                    await this.payosService.createPaymentLink(paymentDto);

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
                    discountPercentage,
                    discount,
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

                if (!orderDto.clientPhoneNumber) {
                    orderDto.clientPhoneNumber = '0000000000';
                } else {
                    const client =
                        await this.usersRepository.findOneByPhoneNumber(
                            orderDto.clientPhoneNumber,
                        );
                    if (client) {
                        const currentLoyaltyPoints = client.loyaltyPoints;
                        const newLoyaltyPoints =
                            currentLoyaltyPoints +
                            Math.round(totalPrice / 1000);
                        await this.usersRepository.updateLoyaltyPoints(
                            client.phone,
                            newLoyaltyPoints,
                        );
                    }
                }

                const prods = orderGeneralDto.products;
                const quantities = orderGeneralDto.quantities;

                for (let i = 0; i < prods.length; i++) {
                    const productId = prods[i].id;
                    const orderedQuantity = quantities[i];

                    const productMaterials =
                        await this.productsRepository.findAllMaterialsOfProduct(
                            productId,
                        );

                    for (const productMaterial of productMaterials) {
                        const materialId = productMaterial.materialId;
                        const materialNeededPerProduct =
                            productMaterial.quantity;

                        const totalMaterialUsed =
                            materialNeededPerProduct * orderedQuantity;
                        const currentMaterialStock =
                            await this.materialsRepository.findById(materialId);
                        if (
                            currentMaterialStock.dataValues.currentStock -
                                totalMaterialUsed <=
                            0
                        ) {
                            await this.productsRepository.updateAvailableStatus(
                                productId,
                                false,
                            );
                            throw new BadRequestException(
                                'Material stock is insufficient',
                            );
                        }
                        await this.materialsRepository.updateMaterialStock(
                            materialId,
                            totalMaterialUsed,
                            'decrement',
                        );
                    }
                }

                const order = await this.ordersRepository.create(
                    orderGeneralDto,
                    orderDetails,
                );

                if (!order) {
                    throw new BadRequestException('Order creation failed');
                }

                // Check if any product should be marked as out of stock due to low material inventory
                await this.checkAndUpdateProductAvailability(prods, quantities);

                return {
                    discountPercentage,
                    discount,
                    message: 'Order created successfully',
                };
            }
        } catch (error: any) {
            throw new InternalServerErrorException((error as Error).message);
        }
    }

    async getAllOrders(): Promise<
        {
            id: string;
            time: string;
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
        if (!orderGeneralDto.clientPhoneNumber) {
            orderGeneralDto.clientPhoneNumber = '0000000000';
        } else {
            const client = await this.usersRepository.findOneByPhoneNumber(
                orderGeneralDto.clientPhoneNumber,
            );
            if (client) {
                const currentLoyaltyPoints = client.loyaltyPoints;
                const newLoyaltyPoints =
                    currentLoyaltyPoints +
                    Math.round(orderDetails.totalPrice / 1000);
                await this.usersRepository.updateLoyaltyPoints(
                    orderGeneralDto.clientPhoneNumber,
                    newLoyaltyPoints,
                );
            }
        }

        try {
            const products = orderGeneralDto.products;
            const quantities = orderGeneralDto.quantities;

            for (let i = 0; i < products.length; i++) {
                const productId = products[i].id;
                const orderedQuantity = quantities[i];

                // Get the materials needed for this product
                const productMaterials =
                    await this.productsRepository.findAllMaterialsOfProduct(
                        productId,
                    );

                for (const productMaterial of productMaterials) {
                    const materialId = productMaterial.materialId;
                    const materialNeededPerProduct = productMaterial.quantity;

                    const totalMaterialUsed =
                        materialNeededPerProduct * orderedQuantity;
                    const currentMaterialStock =
                        await this.materialsRepository.findById(materialId);
                    if (
                        currentMaterialStock.dataValues.currentStock -
                            totalMaterialUsed <=
                        0
                    ) {
                        await this.productsRepository.updateAvailableStatus(
                            productId,
                            false,
                        );
                        throw new BadRequestException(
                            'Material stock is insufficient',
                        );
                    }
                    await this.materialsRepository.updateMaterialStock(
                        materialId,
                        totalMaterialUsed,
                        'decrement',
                    );
                }
            }
        } catch (error: any) {
            console.error('Error completing order:', error);
            throw new Error(`Failed to complete order: ${error.message}`);
        }

        const order = await this.ordersRepository.create(
            orderGeneralDto,
            orderDetails,
        );

        if (!order) {
            throw new BadRequestException('Order creation failed');
        }

        // Check if any product should be marked as out of stock due to low material inventory
        await this.checkAndUpdateProductAvailability(
            orderGeneralDto.products,
            orderGeneralDto.quantities,
        );

        return {
            order: {
                orderDetails,
                orderGeneralDto,
            },
            message: 'Order created successfully',
        };
    }

    async checkPaymentStatus(orderCode: string | number) {
        try {
            // Check payment status with PayOS
            const paymentStatus =
                await this.payosService.checkPaymentStatus(orderCode);

            console.log('Payment status:', paymentStatus);

            if (paymentStatus.rawData.data.status == 'PAID') {
                return {
                    ...paymentStatus,
                    orderCreated: true,
                    message: 'Payment successful and order created',
                };
            } else if (paymentStatus.rawData.data.status == 'PENDING') {
                return {
                    ...paymentStatus,
                    orderCreated: false,
                    message: 'Payment not completed yet',
                };
            }

            return {
                ...paymentStatus,
                orderCreated: false,
                message:
                    'Payment successful but order details not found. Please submit order details.',
            };
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw new InternalServerErrorException(
                `Failed to check payment status: ${error.message}`,
            );
        }
    }

    private cacheOrderData(orderCode: string, orderData: any) {
        this.orderCache.set(orderCode, orderData);
    }
}
