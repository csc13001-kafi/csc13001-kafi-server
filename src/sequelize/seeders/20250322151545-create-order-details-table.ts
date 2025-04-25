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
            const firstOrderId = (orders[2] as { id: string }).id;
            const secondOrderId = (orders[3] as { id: string }).id;

            await queryInterface.bulkInsert('order_details', [
                {
                    id: uuidv4(),
                    orderId: firstOrderId,
                    productId: 'f98755b2-8817-4d0f-ade8-dac0354f9786',
                    price: 50000,
                    quantity: 1,
                },
                {
                    id: uuidv4(),
                    orderId: secondOrderId,
                    productId: '961f34a2-1849-4ac8-b4c3-e5bd055aac36',
                    price: 30000,
                    quantity: 2,
                },
                {
                    id: uuidv4(),
                    orderId: secondOrderId,
                    productId: '65635505-2133-4431-8dd7-42356a479927',
                    price: 40000,
                    quantity: 1,
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
