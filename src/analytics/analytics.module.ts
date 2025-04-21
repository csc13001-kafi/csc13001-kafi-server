import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { AccessControlService } from '../ac/ac.service';
import { MaterialsModule } from '../materials/materials.module';
@Module({
    imports: [
        OrdersModule,
        UsersModule,
        ProductsModule,
        CategoriesModule,
        MaterialsModule,
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService, AccessControlService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
