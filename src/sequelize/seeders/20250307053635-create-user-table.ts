import { QueryInterface } from 'sequelize';
import dotenv from 'dotenv';
import { Role } from '../../auth/enums/roles.enum';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

dotenv.config();

export = {
    async up(queryInterface: QueryInterface) {
        const saltRounds = process.env.SALT_ROUNDS
            ? parseInt(process.env.SALT_ROUNDS)
            : 10;
        const hashedPassword = await bcrypt.hash(
            process.env.MANAGER_PASSWORD,
            saltRounds,
        );

        const users = [
            {
                id: crypto.randomUUID(),
                username: process.env.MANAGER_USERNAME,
                email: process.env.MANAGER_EMAIL,
                password: hashedPassword,
                role: Role.MANAGER,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Add more user objects as needed
        ];

        // Insert the user data into the 'accounts' table
        await queryInterface.bulkInsert('accounts', users);
    },

    async down(queryInterface: QueryInterface) {
        // Clear all data from the 'accounts' table (optional)
        await queryInterface.bulkDelete('accounts', null, {});
    },
};
