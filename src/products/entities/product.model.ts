import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

@Table({
    tableName: 'products',
    timestamps: true,
})
export class Product extends Model {
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Sample Name',
    })
    name: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: process.env.DEFAULT_PRODUCT_IMAGE,
    })
    image: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    price: number;

    @Column({
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
    onStock: boolean;

    @Column({
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'categories', // Name of the referenced table
            key: 'id', // Primary key of the referenced table
        },
        onUpdate: 'CASCADE', // If category ID changes, update product
        onDelete: 'CASCADE', // If category is deleted, delete related products
    })
    categoryId: string;
}
