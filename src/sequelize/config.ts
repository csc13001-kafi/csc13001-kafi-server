import { Dialect } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

interface ISequelizeConfig {
    [key: string]: {
        dialect: Dialect;
        url: string;
        dialectOptions?: {
            ssl: {
                require: boolean;
                rejectUnauthorized: boolean;
            };
        };
    };
}

if (!process.env.DATABASE_MIGRATION) {
    throw new Error('DATABASE environment variable is not set.');
}

const config: ISequelizeConfig = {
    development: {
        dialect: 'postgres',
        url: process.env.DATABASE_MIGRATION,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    },
    test: {
        dialect: 'postgres',
        url: process.env.DATABASE_MIGRATION,
    },
    production: {
        dialect: 'postgres',
        url: process.env.DATABASE_MIGRATION,
    },
};

export = config;
