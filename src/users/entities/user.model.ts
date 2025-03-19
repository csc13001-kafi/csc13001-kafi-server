import { Column, Model, Table } from 'sequelize-typescript';
import { Role } from '../../auth/enums/roles.enum';
import { DataTypes } from 'sequelize';

@Table({
    tableName: 'accounts',
    timestamps: true,
})
export class User extends Model {
    // Basic info
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    username: string;

    @Column({
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    })
    email: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    password: string;

    @Column({
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    })
    phone: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    address: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    birthdate: string;

    @Column({
        type: DataTypes.STRING(500),
        field: 'refresh_token',
    })
    refreshToken: string;

    @Column({
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    })
    declare createdAt: Date;

    @Column({
        type: DataTypes.DATE,
        allowNull: true,
    })
    declare updatedAt: Date;

    @Column({
        type: DataTypes.STRING,
        allowNull: true,
    })
    otp: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: true,
    })
    otpExpiry: Date;

    @Column({
        type: DataTypes.STRING,
    })
    role: Role;

    // For employee
    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    salary: number;

    @Column({
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: () => new Date().toTimeString().split(' ')[0],
    })
    workStart: string;

    @Column({
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: () => new Date().toTimeString().split(' ')[0],
    })
    workEnd: string;

    // For customer
    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    loyaltyPoints: number;
}
