import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'ai_embeddings',
    timestamps: true,
})
export class AiEmbedding extends Model {
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    content: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    category: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    embedding: string;
}
