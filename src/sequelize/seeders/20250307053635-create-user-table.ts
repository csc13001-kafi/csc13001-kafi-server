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

        const managerPassword = await bcrypt.hash(
            process.env.MANAGER_PASSWORD,
            saltRounds,
        );
        const employeePassword = await bcrypt.hash('employee123', saltRounds);
        const guestPassword = await bcrypt.hash('guest123', saltRounds);

        const managerEmail = process.env.MANAGER_EMAIL;
        const employeeEmail = 'employee@example.com';
        const guestEmail = 'guest@example.com';

        // Check if the manager already exists
        const [existingUser] = await queryInterface.sequelize.query(
            `SELECT id FROM accounts WHERE email IN (:emails) LIMIT 1`,
            {
                replacements: {
                    emails: [managerEmail, employeeEmail, guestEmail],
                },
                type: QueryTypes.SELECT,
            },
            // Add more user objects as needed
        );

        if (!existingUser) {
            await queryInterface.bulkInsert('accounts', [
                {
                    id: crypto.randomUUID(),
                    username: process.env.MANAGER_USERNAME || 'manager01',
                    email: managerEmail,
                    password: managerPassword,
                    phone: '1234567890',
                    address: 'Ho Chi Minh City, Vietnam',
                    birthdate: new Date('1990-01-01'),
                    role: Role.MANAGER,
                    salary: 2000000,
                    workStart: '09:00:00',
                    workEnd: '17:00:00',
                    loyaltyPoints: 0,
                    profileImage: process.env.DEFAULT_PROFILE_IMAGE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    username: 'employee01',
                    email: employeeEmail,
                    password: employeePassword,
                    phone: '0987654321',
                    address: 'Hanoi, Vietnam',
                    birthdate: new Date('1995-05-15'),
                    role: Role.EMPLOYEE,
                    salary: 1000000,
                    workStart: '08:30:00',
                    workEnd: '16:30:00',
                    loyaltyPoints: 0,
                    profileImage: process.env.DEFAULT_PROFILE_IMAGE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: crypto.randomUUID(),
                    username: 'guest01',
                    email: guestEmail,
                    password: guestPassword,
                    phone: '0123456789',
                    address: 'Da Nang, Vietnam',
                    birthdate: new Date('2000-09-20'),
                    role: Role.GUEST,
                    salary: 0, // Guests don't have salaries
                    workStart: null,
                    workEnd: null,
                    loyaltyPoints: 50, // Guests can have some initial loyalty points
                    profileImage: process.env.DEFAULT_PROFILE_IMAGE,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]);
        }
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('accounts', null, {});
    },
};
