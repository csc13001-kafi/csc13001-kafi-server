import {
    Column,
    Model,
    Table,
    CreatedAt,
    UpdatedAt,
} from 'sequelize-typescript';
import { Role } from '../../auth/enums/roles.enum';
import { DataTypes } from 'sequelize';

@Table({
    tableName: 'accounts',
    timestamps: true,
})
export class User extends Model {
    @Column({
        primaryKey: true,
        unique: true,
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
        unique: true,
    })
    phone: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    password: string;

    @Column({
        type: DataTypes.STRING(500),
        field: 'refresh_token',
    })
    refreshToken: string;

    @CreatedAt
    @Column({
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    })
    declare createdAt: Date;

    @UpdatedAt
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

    @Column({
        type: DataTypes.DECIMAL,
        allowNull: false,
        defaultValue: 0,
    })
    pts: number;
}
