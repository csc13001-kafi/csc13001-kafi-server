import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.bulkInsert('orders', [
            {
                id: uuidv4(),
                table: 1,
                employeeName: 'Trung Quan',
                clientPhoneNumber: '+1234567890',
                time: new Date(),
                numberOfProducts: 2,
                totalPrice: 150,
                discountPercentage: 10,
                discount: 15,
                afterDiscountPrice: 135,
                paymentMethod: 'cash',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                table: 2,
                employeeName: 'Trung Quan',
                clientPhoneNumber: '+0987654321',
                time: new Date(),
                numberOfProducts: 3,
                totalPrice: 300,
                discountPercentage: 5,
                discount: 15,
                afterDiscountPrice: 285,
                paymentMethod: 'credit',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('orders', null, {});
    },
};
