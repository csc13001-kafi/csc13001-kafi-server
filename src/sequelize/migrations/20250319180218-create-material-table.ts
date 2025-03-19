import { QueryInterface, DataTypes } from 'sequelize';

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('materials', {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                unique: true,
                allowNull: false,
                defaultValue: DataTypes.UUIDV4,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'Sample Name',
            },
            orginalStock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            currentStock: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            unit: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'ml',
            },
            expiredDate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            price: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
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
        await queryInterface.dropTable('materials');
    },
};
