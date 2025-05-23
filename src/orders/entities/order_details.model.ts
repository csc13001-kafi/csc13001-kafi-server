import { Column, Model, Table, ForeignKey } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Product } from '../../products/entities/product.model';
import { Order } from './order.model';

@Table({
    tableName: 'order_details',
    timestamps: false,
})
export class OrderDetails extends Model {
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

    @ForeignKey(() => Order)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    orderId: string;

    @ForeignKey(() => Product)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    productId: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    price: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    quantity: number;
}
