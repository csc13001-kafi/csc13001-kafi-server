import { QueryInterface, QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
export = {
    async up(queryInterface: QueryInterface) {
        // Fetch existing order IDs from the orders table
        const orders = await queryInterface.sequelize.query(
            `SELECT id FROM orders`,
            { type: QueryTypes.SELECT },
        );

        if (orders.length > 0) {
            // Assuming there are orders and using the first order's ID for all entries
            const firstOrderId = (orders[0] as { id: string }).id;
            const secondOrderId = (orders[1] as { id: string }).id;

            await queryInterface.bulkInsert('order_details', [
                {
                    id: uuidv4(),
                    orderId: firstOrderId,
                    productId: '218e5479-75e5-4d90-9ea7-6c9869569f74',
                    price: 100,
                    quantity: 2,
                },
                {
                    id: uuidv4(),
                    orderId: firstOrderId,
                    productId: 'd4a7ecea-2887-4808-9e3d-cbb709013ed1',
                    price: 150,
                    quantity: 1,
                },
                {
                    id: uuidv4(),
                    orderId: secondOrderId,
                    productId: 'aaf3fa0d-8bab-4e2d-b287-9699e4f6f610',
                    price: 200,
                    quantity: 3,
                },
                {
                    id: uuidv4(),
                    orderId: secondOrderId,
                    productId: '218e5479-75e5-4d90-9ea7-6c9869569f74',
                    price: 120,
                    quantity: 1,
                },
                {
                    id: uuidv4(),
                    orderId: secondOrderId,
                    productId: 'd4a7ecea-2887-4808-9e3d-cbb709013ed1',
                    price: 160,
                    quantity: 2,
                },
            ]);
        } else {
            console.log(
                'No orders found. Seed data for order_details cannot be inserted.',
            );
        }
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('order_details', null, {});
    },
};
