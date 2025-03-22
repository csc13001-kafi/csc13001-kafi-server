import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import { PaymentMethod } from '../enums/payment-method.enum';
dotenv.config();

@Table({
    tableName: 'orders',
    timestamps: true,
})
export class Order extends Model {
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    table: number;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    employeeName: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    clientPhoneNumber: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    time: Date;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    numberOfProducts: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    totalPrice: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    discountPercentage: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    discount: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    afterDiscountPrice: number;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
    })
    paymentMethod: PaymentMethod;
}
