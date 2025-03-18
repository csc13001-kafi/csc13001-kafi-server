import { QueryInterface, DataTypes } from 'sequelize';

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable('accounts', {
            id: {
                primaryKey: true,
                unique: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            address: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            birthdate: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            refreshToken: {
                type: DataTypes.STRING(500),
                field: 'refresh_token',
            },
            otp: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            otpExpiry: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            salary: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            workStart: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            workEnd: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            loyaltyPoints: {
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
        await queryInterface.dropTable('accounts');
    },
};
