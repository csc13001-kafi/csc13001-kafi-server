import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.bulkInsert('orders', [
            {
                id: uuidv4(),
                table: 1,
                employeeName: 'Trung Quan',
                clientPhoneNumber: '1234567890',
                time: new Date(),
                numberOfProducts: 1,
                totalPrice: 50000,
                discountPercentage: 0,
                discount: 0,
                afterDiscountPrice: 0,
                paymentMethod: 'QR',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: uuidv4(),
                table: 2,
                employeeName: 'Trung Quan',
                clientPhoneNumber: '0987654321',
                time: new Date(),
                numberOfProducts: 2,
                totalPrice: 100000,
                discountPercentage: 0,
                discount: 0,
                afterDiscountPrice: 0,
                paymentMethod: 'Cash',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('orders', null, {});
    },
};
