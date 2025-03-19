import { QueryInterface } from 'sequelize';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.bulkInsert('categories', [
            {
                id: uuidv4(),
                name: 'Đá Xay',
                image: process.env.DEFAULT_CATEGORY_IMAGE,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Trà',
                image: process.env.DEFAULT_CATEGORY_IMAGE,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Matcha',
                image: process.env.DEFAULT_CATEGORY_IMAGE,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Cà Phê',
                image: process.env.DEFAULT_CATEGORY_IMAGE,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'Bánh Ngọt',
                image: process.env.DEFAULT_CATEGORY_IMAGE,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('categories', null, {});
    },
};
