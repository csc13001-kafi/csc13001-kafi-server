import { QueryInterface, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('products', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                unique: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Sample Name',
            },
            image: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: process.env.DEFAULT_PRODUCT_IMAGE,
            },
            price: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            onStock: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            categoryId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'categories', // Name of the referenced table
                    key: 'id', // Primary key of the referenced table
                },
                onUpdate: 'CASCADE', // If category ID changes, update product
                onDelete: 'CASCADE', // If category is deleted, delete related products
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('products');
    },
};
