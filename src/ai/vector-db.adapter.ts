import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingsRepository } from './embeddings.repository';

@Injectable()
export class VectorDBAdapter {
    private openai: OpenAI;
    private readonly logger = new Logger(VectorDBAdapter.name);

    constructor(
        private configService: ConfigService,
        private embeddingsRepository: EmbeddingsRepository,
    ) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async initialize(texts: string[]): Promise<void> {
        try {
            await this.embeddingsRepository.initialize();

            // Check if there already have embeddings
            const count = await this.embeddingsRepository.countEmbeddings();

            if (count > 0) {
                this.logger.log(
                    `Found ${count} existing embeddings in database, skipping initialization`,
                );
                return;
            }

            this.logger.log(
                `Generating embeddings for ${texts.length} knowledge items...`,
            );

            // Create embeddings for all documents in batches
            const batchSize = 10;
            const embeddingsData = [];

            for (let i = 0; i < texts.length; i += batchSize) {
                const batch = texts.slice(i, i + batchSize);
                try {
                    const embeddingResponse =
                        await this.openai.embeddings.create({
                            // This is important: use a supported model
                            model: 'text-embedding-3-small',
                            input: batch,
                            encoding_format: 'float',
                        });

                    // Add to embeddings data array
                    batch.forEach((text, index) => {
                        embeddingsData.push({
                            content: text,
                            category: 'knowledge_base',
                            embedding: embeddingResponse.data[index].embedding,
                        });
                    });

                    this.logger.log(
                        `Generated embeddings for batch ${i / batchSize + 1}/${Math.ceil(texts.length / batchSize)}`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Error creating embeddings: ${error.message}`,
                    );
                }
            }

            if (embeddingsData.length > 0) {
                // Store all embeddings in the database
                await this.embeddingsRepository.bulkStoreEmbeddings(
                    embeddingsData,
                );
                this.logger.log(
                    `Stored ${embeddingsData.length} embeddings in pgvector database`,
                );
            } else {
                this.logger.error('No embeddings were generated to store');
            }
        } catch (error) {
            this.logger.error(`Error during initialization: ${error.message}`);
            throw error;
        }
    }

    async querySimilar(queryEmbedding: number[], limit = 3): Promise<string[]> {
        try {
            const similarDocuments =
                await this.embeddingsRepository.findSimilarDocuments(
                    queryEmbedding,
                    limit,
                );

            if (similarDocuments.length === 0) {
                return ['Không có dữ liệu để tham khảo.'];
            }

            return similarDocuments.map((doc) => doc.content);
        } catch (error) {
            this.logger.error(
                `Error querying similar documents: ${error.message}`,
            );
            return ['Đã xảy ra lỗi khi tìm kiếm thông tin tham khảo.'];
        }
    }

    async addDocument(
        text: string,
        category = 'knowledge_base',
    ): Promise<void> {
        try {
            const embeddingResponse = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: [text],
                encoding_format: 'float',
            });

            await this.embeddingsRepository.storeEmbedding(
                text,
                category,
                embeddingResponse.data[0].embedding,
            );

            this.logger.log(`Added new document to vector database`);
        } catch (error) {
            this.logger.error(`Error adding document: ${error.message}`);
        }
    }
}
