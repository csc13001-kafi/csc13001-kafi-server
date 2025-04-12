import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Order } from '../orders/entities/order.model';
import { User } from '../users/entities/user.model';
import { Category } from '../categories/entities/category.model';
import { Product } from '../products/entities/product.model';
import { AccessControlService } from '../ac/ac.service';

@Module({
    imports: [SequelizeModule.forFeature([Order, User, Category, Product])],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AccessControlService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
