import { QueryInterface, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        // Fetch category IDs
        const categories = await queryInterface.sequelize.query(
            `SELECT id, name FROM categories`,
            { type: QueryTypes.SELECT },
        );

        // Map category names to their IDs
        const categoryMap = Object.fromEntries(
            categories.map((c: any) => [c.name, c.id]),
        );

        await queryInterface.bulkInsert('products', [
            {
                id: uuidv4(),
                name: 'Product A',
                image: process.env.DEFAULT_PRODUCT_IMAGE,
                price: 100,
                onStock: true,
                categoryId: categoryMap['Đá Xay'] || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Product B',
                image: process.env.DEFAULT_PRODUCT_IMAGE,
                price: 200,
                onStock: false,
                categoryId: categoryMap['Trà'] || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Product C',
                image: process.env.DEFAULT_PRODUCT_IMAGE,
                price: 150,
                onStock: true,
                categoryId: categoryMap['Matcha'] || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('products', null, {});
    },
};
