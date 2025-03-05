import {
    Column,
    Model,
    Table,
    Unique,
    DataType,
    CreatedAt,
    UpdatedAt,
    IsEmail,
} from 'sequelize-typescript';
import { Role } from '../../auth/enums/roles.enum';

@Table({
    tableName: 'accounts',
    timestamps: true,
})
export class User extends Model {
    @Column({
        primaryKey: true,
        allowNull: false,
        unique: true,
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataType.STRING,
    })
    username: string;

    @Unique
    @IsEmail
    @Column({
        type: DataType.STRING,
        unique: true,
    })
    email: string;

    @Column({
        type: DataType.STRING,
    })
    password: string;

    @Column({
        type: DataType.STRING(500),
        field: 'refresh_token',
    })
    refreshToken: string;

    @CreatedAt
    @Column({
        field: 'created_at',
        type: DataType.DATE,
        defaultValue: DataType.NOW,
    })
    declare createdAt: Date;

    @UpdatedAt
    @Column({
        field: 'updated_at',
        type: DataType.DATE,
        allowNull: true,
    })
    declare updatedAt: Date;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    otp: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    otpExpiry: Date;

    @Column({
        type: DataType.STRING,
    })
    role: Role;
}
