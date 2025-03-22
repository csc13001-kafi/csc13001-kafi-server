import { QueryInterface, DataTypes } from 'sequelize';

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('orders', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                unique: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            table: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            employeeName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            clientPhoneNumber: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            time: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            numberOfProducts: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            totalPrice: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            discountPercentage: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            discount: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            afterDiscountPrice: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            paymentMethod: {
                type: DataTypes.STRING,
                allowNull: false,
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
        await queryInterface.dropTable('orders');
    },
};
