import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.model';
import { OrderDetails } from './entities/order_details.model';
import { OrdersController } from './orders.controller';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { PayosModule } from '../payment/payos/payos.module';
import { PaymentModule } from '../payment/payment.module';
import { MaterialsModule } from '../materials/materials.module';
@Module({
    imports: [
        SequelizeModule.forFeature([Order, OrderDetails]),
        ProductsModule,
        UsersModule,
        PayosModule,
        MaterialsModule,
        forwardRef(() => PaymentModule),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersRepository],
    exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
