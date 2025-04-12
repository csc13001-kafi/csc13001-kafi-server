import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as vectorExtensionMigration from './vector-extension.migration';
import { QueryTypes } from 'sequelize';

@Injectable()
export class MigrationRunner implements OnModuleInit {
    private readonly logger = new Logger(MigrationRunner.name);

    constructor(
        @InjectConnection()
        private readonly sequelize: Sequelize,
    ) {}

    async onModuleInit() {
        await this.runMigrations();
    }

    async runMigrations() {
        this.logger.log('Running pgvector migrations...');

        try {
            // Check if the table exists with wrong column type
            const tableCheck = await this.sequelize.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'ai_embeddings'
                );`,
                { type: 'SELECT' },
            );

            const tableExists = tableCheck[0]['exists'];

            if (tableExists) {
                // Check if the table has the embedding column with the correct type
                const [columnCheck] = (await this.sequelize.query(
                    `SELECT data_type FROM information_schema.columns
                    WHERE table_name = 'ai_embeddings'
                    AND column_name = 'embedding'`,
                    { type: QueryTypes.SELECT },
                )) as [any];

                // If the table exists but column is wrong type (e.g. double precision[] instead of vector)
                if (
                    columnCheck.length === 0 ||
                    (columnCheck[0]?.data_type !== 'USER-DEFINED' &&
                        columnCheck[0]?.data_type !== 'vector')
                ) {
                    this.logger.warn(
                        `Found existing 'ai_embeddings' table with incorrect column type: ${columnCheck[0]?.data_type}`,
                    );
                    this.logger.warn(
                        'Dropping and recreating table with correct vector type...',
                    );

                    await this.sequelize.query(
                        'DROP TABLE IF EXISTS "ai_embeddings";',
                    );
                }
            }

            await this.sequelize.query(
                'CREATE EXTENSION IF NOT EXISTS vector;',
            );

            // Run the migration to set up tables and indexes
            await vectorExtensionMigration.up(
                this.sequelize.getQueryInterface(),
            );
            this.logger.log('Successfully completed pgvector migration');
        } catch (error) {
            this.logger.error(
                `Failed to run pgvector migration: ${error.message}`,
            );

            // Check if the error is about vector extension not being available
            if (
                error.message.includes('extension "vector" is not available') ||
                error.message.includes('could not open extension control file')
            ) {
                this.logger.error(
                    'The pgvector extension is not installed in your PostgreSQL. Please install it first.',
                );
                this.logger.error(
                    'You can install pgvector by running: CREATE EXTENSION vector;',
                );

                // Create fallback table without vector type
                try {
                    this.logger.warn(
                        'Creating fallback table without vector support...',
                    );
                    await this.createFallbackTable();
                    this.logger.log(
                        'Created fallback table. Similarity search will use JavaScript implementation.',
                    );
                } catch (fallbackError) {
                    this.logger.error(
                        `Failed to create fallback table: ${fallbackError.message}`,
                    );
                }
            } else if (
                error.message.includes('operator class') &&
                error.message.includes('does not accept data type')
            ) {
                // Handle specific vector operator class issues
                this.logger.warn(
                    'Issue with pgvector operator class. Creating basic table without index...',
                );
                try {
                    await this.createBasicTable();
                    this.logger.log(
                        'Created basic table without special index.',
                    );
                } catch (basicError) {
                    this.logger.error(
                        `Failed to create basic table: ${basicError.message}`,
                    );
                }
            } else if (
                error.message.includes('column "embedding" is of type') &&
                error.message.includes('but expression is of type vector')
            ) {
                // Handle type mismatch between column and expression
                this.logger.warn(
                    'Column type mismatch detected. Recreating table with correct types...',
                );
                try {
                    // Drop the table and recreate with correct type
                    await this.sequelize.query(
                        'DROP TABLE IF EXISTS "ai_embeddings";',
                    );
                    await this.createBasicTable();
                    this.logger.log('Recreated table with correct vector type');
                } catch (recreateError) {
                    this.logger.error(
                        `Failed to recreate table: ${recreateError.message}`,
                    );

                    // Fall back to text storage if vector type fails
                    try {
                        await this.createFallbackTable();
                        this.logger.log(
                            'Created fallback table without vector support',
                        );
                    } catch (fallbackError) {
                        this.logger.error(
                            `Fallback table creation failed: ${fallbackError.message}`,
                        );
                    }
                }
            }
        }
    }

    /**
     * Create a fallback table for embeddings without vector type
     */
    private async createFallbackTable() {
        await this.sequelize.query(`
            CREATE TABLE IF NOT EXISTS "ai_embeddings" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "content" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "embedding" TEXT NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);
    }

    /**
     * Create a basic table with vector type but no specialized index
     */
    private async createBasicTable() {
        // First check if vector extension is available
        try {
            await this.sequelize.query(
                'CREATE EXTENSION IF NOT EXISTS vector;',
            );

            // Create table with vector type but no specialized index
            await this.sequelize.query(`
                CREATE TABLE IF NOT EXISTS "ai_embeddings" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "content" TEXT NOT NULL,
                    "category" TEXT NOT NULL,
                    "embedding" vector(1536) NOT NULL,
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `);

            // Try to create a basic B-tree index
            try {
                await this.sequelize.query(`
                    CREATE INDEX IF NOT EXISTS "ai_embeddings_category_idx"
                    ON "ai_embeddings" ("category");
                `);
            } catch (indexError) {
                this.logger.warn(
                    `Could not create category index: ${indexError.message}`,
                );
            }
        } catch (error) {
            this.logger.error(
                `Vector extension not available: ${error.message}`,
            );
            // Fall back to text-based storage
            await this.createFallbackTable();
        }
    }
}
