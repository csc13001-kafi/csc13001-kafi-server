import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class EmbeddingsRepository {
    private readonly logger = new Logger(EmbeddingsRepository.name);

    constructor(
        @InjectConnection()
        private readonly sequelize: Sequelize,
    ) {}

    async initialize(): Promise<void> {
        try {
            // Make sure pgvector extension is installed
            await this.sequelize.query(
                'CREATE EXTENSION IF NOT EXISTS vector;',
            );
            this.logger.log('PgVector extension initialized');
        } catch (error) {
            this.logger.error(`Error initializing pgvector: ${error.message}`);
        }
    }

    async storeEmbedding(
        content: string,
        category: string,
        embedding: number[],
    ): Promise<string> {
        try {
            // Check the column type before inserting
            const columnCheck = await this.checkEmbeddingColumnType();

            // Format the embedding as a properly escaped string
            const vectorString = this.formatVectorString(embedding);

            let query = '';

            // Use the appropriate insertion method based on column type
            if (columnCheck.isVector) {
                query = `
                    INSERT INTO "ai_embeddings" ("content", "category", "embedding")
                    VALUES (:content, :category, :embedding::vector)
                    RETURNING "id";
                `;
            } else if (columnCheck.isArray) {
                query = `
                    INSERT INTO "ai_embeddings" ("content", "category", "embedding")
                    VALUES (:content, :category, :embedding::double precision[])
                    RETURNING "id";
                `;
            } else {
                query = `
                    INSERT INTO "ai_embeddings" ("content", "category", "embedding")
                    VALUES (:content, :category, :embedding)
                    RETURNING "id";
                `;
            }

            const result = await this.sequelize.query(query, {
                replacements: {
                    content,
                    category,
                    embedding: vectorString,
                },
                type: 'SELECT',
            });

            return result[0]['id'];
        } catch (error) {
            this.logger.error(`Error storing embedding: ${error.message}`);
            throw error;
        }
    }

    async bulkStoreEmbeddings(
        data: { content: string; category: string; embedding: number[] }[],
    ): Promise<void> {
        try {
            // First, check the column type before inserting
            const columnCheck = await this.checkEmbeddingColumnType();

            // Using a transaction for bulk insert
            await this.sequelize.transaction(async (t) => {
                for (const item of data) {
                    try {
                        // Format the embedding according to the column type
                        const vectorString = this.formatVectorString(
                            item.embedding,
                        );

                        // If the column is vector type, use ::vector cast, otherwise store as text
                        if (columnCheck.isVector) {
                            await this.sequelize.query(
                                `
                                INSERT INTO "ai_embeddings" ("content", "category", "embedding")
                                VALUES (:content, :category, :embedding::vector);
                            `,
                                {
                                    replacements: {
                                        content: item.content,
                                        category: item.category,
                                        embedding: vectorString,
                                    },
                                    transaction: t,
                                },
                            );
                        } else if (columnCheck.isArray) {
                            // If the column is an array, insert as array
                            await this.sequelize.query(
                                `
                                INSERT INTO "ai_embeddings" ("content", "category", "embedding")
                                VALUES (:content, :category, :embedding::double precision[]);
                            `,
                                {
                                    replacements: {
                                        content: item.content,
                                        category: item.category,
                                        embedding: vectorString,
                                    },
                                    transaction: t,
                                },
                            );
                        } else {
                            // Default to text storage
                            await this.sequelize.query(
                                `
                                INSERT INTO "ai_embeddings" ("content", "category", "embedding")
                                VALUES (:content, :category, :embedding);
                            `,
                                {
                                    replacements: {
                                        content: item.content,
                                        category: item.category,
                                        embedding: vectorString,
                                    },
                                    transaction: t,
                                },
                            );
                        }
                    } catch (itemError) {
                        this.logger.error(
                            `Error inserting item: ${itemError.message}`,
                        );
                        // Continue with next item instead of failing the entire batch
                    }
                }
            });

            this.logger.log(`Stored ${data.length} embeddings in database`);
        } catch (error) {
            this.logger.error(
                `Error storing embeddings in bulk: ${error.message}`,
            );
            throw error;
        }
    }

    /**
     * Check the type of the embedding column to determine how to insert data
     */
    private async checkEmbeddingColumnType(): Promise<{
        exists: boolean;
        isVector: boolean;
        isArray: boolean;
        dataType: string;
    }> {
        try {
            // First check if table exists
            const tableCheck = await this.sequelize.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'ai_embeddings'
                );`,
                { type: 'SELECT' },
            );

            const tableExists = tableCheck[0]['exists'];

            if (!tableExists) {
                return {
                    exists: false,
                    isVector: false,
                    isArray: false,
                    dataType: '',
                };
            }

            // Check the column type
            const columnCheck = (await this.sequelize.query(
                `SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'ai_embeddings'
                AND column_name = 'embedding';`,
                { type: 'SELECT' },
            )) as any[];

            if (columnCheck.length === 0) {
                return {
                    exists: true,
                    isVector: false,
                    isArray: false,
                    dataType: '',
                };
            }

            const dataType = columnCheck[0]['data_type'].toLowerCase();

            return {
                exists: true,
                isVector: dataType === 'USER-DEFINED' || dataType === 'vector',
                isArray:
                    dataType === 'ARRAY' ||
                    dataType.includes('double precision'),
                dataType,
            };
        } catch (error) {
            this.logger.error(`Error checking column type: ${error.message}`);
            // Default to treating as vector
            return {
                exists: true,
                isVector: true,
                isArray: false,
                dataType: 'unknown',
            };
        }
    }

    async findSimilarDocuments(
        embedding: number[],
        limit = 3,
    ): Promise<{ id: string; content: string; similarity: number }[]> {
        try {
            // Format the embedding as a properly escaped vector string
            const vectorString = this.formatVectorString(embedding);

            // Check the column type
            const columnCheck = await this.checkEmbeddingColumnType();

            // If we have a vector column, use vector operations
            if (columnCheck.isVector) {
                try {
                    // First try with cosine distance operator (<->)
                    const results = await this.sequelize.query(
                        `
                        SELECT
                            "id",
                            "content",
                            1 - ("embedding" <-> :embedding::vector) as "similarity"
                        FROM "ai_embeddings"
                        ORDER BY "similarity" DESC
                        LIMIT :limit;
                    `,
                        {
                            replacements: {
                                embedding: vectorString,
                                limit,
                            },
                            type: 'SELECT',
                        },
                    );

                    return results as {
                        id: string;
                        content: string;
                        similarity: number;
                    }[];
                } catch (operatorError) {
                    // If the cosine distance operator fails, try with Euclidean distance (<=>)
                    this.logger.warn(
                        `Cosine distance failed: ${operatorError.message}. Trying Euclidean distance...`,
                    );

                    try {
                        const results = await this.sequelize.query(
                            `
                            SELECT
                                "id",
                                "content",
                                1 - ("embedding" <=> :embedding::vector) as "similarity"
                            FROM "ai_embeddings"
                            ORDER BY "similarity" DESC
                            LIMIT :limit;
                        `,
                            {
                                replacements: {
                                    embedding: vectorString,
                                    limit,
                                },
                                type: 'SELECT',
                            },
                        );

                        return results as {
                            id: string;
                            content: string;
                            similarity: number;
                        }[];
                    } catch (euclideanError) {
                        this.logger.warn(
                            `Euclidean distance failed: ${euclideanError.message}. Using fallback approach...`,
                        );
                        return this.findSimilarDocumentsFallback(
                            embedding,
                            limit,
                        );
                    }
                }
            } else if (columnCheck.isArray) {
                // If the column is an array type, use array operations
                try {
                    const results = await this.sequelize.query(
                        `
                        SELECT
                            "id",
                            "content",
                            -- Simple dot product for similarity
                            (
                                SELECT SUM(e1 * e2)
                                FROM UNNEST("embedding", :embedding::double precision[]) AS t(e1, e2)
                            ) / (
                                SQRT(
                                    (SELECT SUM(e * e) FROM UNNEST("embedding") AS e) *
                                    (SELECT SUM(e * e) FROM UNNEST(:embedding::double precision[]) AS e)
                                )
                            ) as "similarity"
                        FROM "ai_embeddings"
                        ORDER BY "similarity" DESC
                        LIMIT :limit;
                    `,
                        {
                            replacements: {
                                embedding: vectorString,
                                limit,
                            },
                            type: 'SELECT',
                        },
                    );

                    return results as {
                        id: string;
                        content: string;
                        similarity: number;
                    }[];
                } catch (arrayError) {
                    this.logger.warn(
                        `Array operations failed: ${arrayError.message}. Using fallback approach...`,
                    );
                    return this.findSimilarDocumentsFallback(embedding, limit);
                }
            } else {
                // If neither vector nor array type, use fallback
                return this.findSimilarDocumentsFallback(embedding, limit);
            }
        } catch (error) {
            this.logger.error(
                `Error finding similar documents: ${error.message}`,
            );
            return [];
        }
    }

    /**
     * Fallback method for finding similar documents when vector operations aren't available
     */
    private async findSimilarDocumentsFallback(
        embedding: number[],
        limit = 3,
    ): Promise<{ id: string; content: string; similarity: number }[]> {
        try {
            // Get all embeddings and compute similarity in JavaScript
            const allEmbeddings = await this.sequelize.query(
                `
                SELECT "id", "content", "embedding"::text
                FROM "ai_embeddings"
                LIMIT 100; -- Limit to prevent memory issues
            `,
                { type: 'SELECT' },
            );

            const parsed = allEmbeddings.map((row: any) => {
                try {
                    // Parse the embedding text from [x,y,z] format
                    const embStr = row.embedding
                        .replace('[', '')
                        .replace(']', '');
                    const emb = embStr.split(',').map(Number);

                    return {
                        id: row.id,
                        content: row.content,
                        embedding: emb,
                        // Calculate similarity (simple dot product for fallback)
                        similarity: this.calculateSimilarity(embedding, emb),
                    };
                } catch {
                    // If we can't parse this row, return with zero similarity
                    return {
                        id: row.id,
                        content: row.content,
                        similarity: 0,
                    };
                }
            });

            // Sort by similarity and take top results
            parsed.sort((a, b) => b.similarity - a.similarity);
            return parsed.slice(0, limit);
        } catch (fallbackError) {
            this.logger.error(
                `Fallback similarity search failed: ${fallbackError.message}`,
            );
            return [];
        }
    }

    /**
     * Calculate similarity between two vectors (fallback method)
     */
    private calculateSimilarity(a: number[], b: number[]): number {
        if (!a || !b || a.length !== b.length) {
            return 0;
        }

        // Simple dot product for fallback similarity
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        // Cosine similarity
        const similarity =
            normA && normB
                ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
                : 0;

        return similarity;
    }

    async countEmbeddings(): Promise<number> {
        const [result] = await this.sequelize.query(
            `
            SELECT COUNT(*) as count FROM "ai_embeddings";
        `,
            { type: 'SELECT' },
        );

        return parseInt(result['count'] as string, 10);
    }

    async deleteAllEmbeddings(): Promise<void> {
        await this.sequelize.query(`
            TRUNCATE TABLE "ai_embeddings";
        `);

        this.logger.log('All embeddings deleted from database');
    }

    async getEmbeddingsByCategory(
        category: string,
    ): Promise<{ id: string; content: string }[]> {
        const results = await this.sequelize.query(
            `
            SELECT "id", "content"
            FROM "ai_embeddings"
            WHERE "category" = :category;
        `,
            {
                replacements: { category },
                type: 'SELECT',
            },
        );

        return results as { id: string; content: string }[];
    }

    /**
     * Format a number array into a proper pgvector string
     */
    private formatVectorString(embedding: number[]): string {
        return `[${embedding.join(',')}]`;
    }
}
