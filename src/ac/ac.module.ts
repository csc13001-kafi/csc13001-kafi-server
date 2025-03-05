import { Module } from '@nestjs/common';

import { AccessControlService } from './ac.service';

@Module({
    providers: [AccessControlService],
    exports: [AccessControlService],
})
export class AccessControlModule {}
