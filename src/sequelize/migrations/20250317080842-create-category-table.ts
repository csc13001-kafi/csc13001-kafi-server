import { QueryInterface, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('categories', {
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
                defaultValue: process.env.DEFAULT_CATEGORY_IMAGE,
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
        await queryInterface.dropTable('categories');
    },
};
