import { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
    try {
        // Install the pgvector extension
        await queryInterface.sequelize.query(
            'CREATE EXTENSION IF NOT EXISTS vector;',
        );

        // Create the ai_embeddings table with vector support
        await queryInterface.sequelize.query(`
            CREATE TABLE IF NOT EXISTS "ai_embeddings" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "content" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "embedding" vector(1536) NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);

        // Try to create an index using ivfflat (suitable for larger datasets)
        try {
            await queryInterface.sequelize.query(`
                CREATE INDEX IF NOT EXISTS "ai_embeddings_embedding_idx"
                ON "ai_embeddings"
                USING ivfflat (embedding);
            `);
        } catch (indexError) {
            console.warn('Could not create ivfflat index:', indexError.message);

            // Fallback to a basic index if ivfflat fails
            try {
                await queryInterface.sequelize.query(`
                    CREATE INDEX IF NOT EXISTS "ai_embeddings_embedding_idx"
                    ON "ai_embeddings" (embedding);
                `);
                console.log('Created basic index instead');
            } catch (basicIndexError) {
                console.warn(
                    'Could not create basic index either:',
                    basicIndexError.message,
                );

                // If both index types fail, we'll proceed without an index
                // Searches will still work but will be slower
                console.log(
                    'Proceeding without an index - similarity searches will be slower',
                );
            }
        }
    } catch (error) {
        console.error('PgVector migration error:', error);
        throw error;
    }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
    // Drop the table
    await queryInterface.sequelize.query(
        'DROP TABLE IF EXISTS "ai_embeddings";',
    );
}
