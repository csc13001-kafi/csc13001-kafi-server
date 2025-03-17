import { QueryInterface, QueryTypes } from 'sequelize';
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

        const managerEmail = process.env.MANAGER_EMAIL;

        // Check if the manager already exists
        const [existingUser] = await queryInterface.sequelize.query(
            `SELECT id FROM accounts WHERE email = :email LIMIT 1`,
            {
                replacements: { email: managerEmail },
                type: QueryTypes.SELECT,
            },
        );

        if (!existingUser) {
            await queryInterface.bulkInsert('accounts', [
                {
                    id: crypto.randomUUID(),
                    username: process.env.MANAGER_USERNAME,
                    email: managerEmail,
                    password: hashedPassword,
                    role: Role.MANAGER,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        }
    },

    async down(queryInterface: QueryInterface) {
        // Clear all data from the 'accounts' table (optional)
        await queryInterface.bulkDelete('accounts', null, {});
    },
};
