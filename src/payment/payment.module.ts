import { Module, forwardRef } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { HttpModule } from '@nestjs/axios';
import { OrdersModule } from '../orders/orders.module';
import { WebhooksController } from './payment.controller';
import { ConfigModule } from '@nestjs/config';
import { PayOSService } from './payos/payos.service';
@Module({
    imports: [HttpModule, forwardRef(() => OrdersModule), ConfigModule],
    controllers: [WebhooksController],
    providers: [PaymentService, PayOSService],
    exports: [PaymentService],
})
export class PaymentModule {}
