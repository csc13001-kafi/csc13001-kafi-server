import { Module } from '@nestjs/common';
import { PayOSService } from '../payos/payos.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
@Module({
    imports: [ConfigModule, HttpModule],
    providers: [PayOSService],
    exports: [PayOSService],
})
export class PayosModule {}
