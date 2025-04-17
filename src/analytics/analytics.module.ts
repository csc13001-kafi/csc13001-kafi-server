import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { OrdersModule } from 'src/orders/orders.module';
import { UsersModule } from 'src/users/users.module';
import { ProductsModule } from 'src/products/products.module';
import { CategoriesModule } from 'src/categories/categories.module';
import { AccessControlService } from 'src/ac/ac.service';
import { MaterialsModule } from 'src/materials/materials.module';
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
