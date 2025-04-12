import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ConfigModule } from '@nestjs/config';
import { AiGateway } from './ai.gateway';
import { VectorDBAdapter } from './vector-db.adapter';
import { AiController } from './ai.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AiEmbedding } from './entities/embedding.model';
import { EmbeddingsRepository } from './embeddings.repository';
import { MigrationRunner } from './migrations/migration.runner';

@Module({
    imports: [ConfigModule, SequelizeModule.forFeature([AiEmbedding])],
    controllers: [AiController],
    providers: [
        AiService,
        AiGateway,
        VectorDBAdapter,
        EmbeddingsRepository,
        MigrationRunner,
    ],
    exports: [AiService],
})
export class AiModule {}
