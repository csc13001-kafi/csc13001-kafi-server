import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { VectorDBAdapter } from './vector-db.adapter';
import { AiEmbedding } from './entities/embedding.model';
import { EmbeddingsRepository } from './embeddings.repository';
import { MigrationRunner } from './migrations/migration.runner';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
    imports: [
        ConfigModule,
        SequelizeModule.forFeature([AiEmbedding]),
        AnalyticsModule,
    ],
    controllers: [AiController],
    providers: [
        AiService,
        VectorDBAdapter,
        EmbeddingsRepository,
        MigrationRunner,
    ],
    exports: [AiService],
})
export class AiModule {}
