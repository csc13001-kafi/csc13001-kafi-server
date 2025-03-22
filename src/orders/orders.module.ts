import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.model';
import { OrderDetails } from './entities/order_details.model';
import { OrdersController } from './orders.controller';
import { ProductsModule } from 'src/products/products.module';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [
        SequelizeModule.forFeature([Order, OrderDetails]),
        ProductsModule,
        UsersModule,
    ],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersRepository],
    exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
