import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.bulkInsert('materials', [
            {
                id: uuidv4(),
                name: 'sữa',
                orginalStock: 1000,
                currentStock: 1000,
                unit: 'ml',
                expiredDate: new Date('2025-12-31'),
                price: 150,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'đường',
                orginalStock: 500,
                currentStock: 500,
                unit: 'g',
                expiredDate: new Date('2025-12-31'),
                price: 50,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'cà phê',
                orginalStock: 300,
                currentStock: 300,
                unit: 'g',
                expiredDate: new Date('2025-12-31'),
                price: 200,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'bột cacao',
                orginalStock: 200,
                currentStock: 200,
                unit: 'g',
                expiredDate: new Date('2025-12-31'),
                price: 180,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                name: 'trà',
                orginalStock: 800,
                currentStock: 800,
                unit: 'g',
                expiredDate: new Date('2025-12-31'),
                price: 120,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('materials', null, {});
    },
};
