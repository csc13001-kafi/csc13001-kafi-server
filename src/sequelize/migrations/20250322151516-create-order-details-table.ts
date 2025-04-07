import { QueryInterface, DataTypes } from 'sequelize';

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('order_details', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                unique: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            orderId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            productId: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            price: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('order_details');
    },
};
