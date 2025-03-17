import { QueryInterface } from 'sequelize';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.bulkInsert('products', [
            {
                id: uuidv4(),
                name: 'Product A',
                image: process.env.DEFAULT_PRODUCT_IMAGE,
                price: 100,
                onStock: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Product B',
                image: process.env.DEFAULT_PRODUCT_IMAGE,
                price: 200,
                onStock: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Product C',
                image: process.env.DEFAULT_PRODUCT_IMAGE,
                price: 150,
                onStock: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('products', null, {});
    },
};
