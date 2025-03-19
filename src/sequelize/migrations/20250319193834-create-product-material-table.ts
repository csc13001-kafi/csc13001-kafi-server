import { QueryInterface, DataTypes } from 'sequelize';

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('product_materials', {
            productId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            materialId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'materials',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
        });
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable('product_materials');
    },
};
