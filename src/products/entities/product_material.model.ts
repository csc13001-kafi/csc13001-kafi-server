import {
    Column,
    Model,
    Table,
    ForeignKey,
    PrimaryKey,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Product } from './product.model';
import { Material } from '../../materials/entities/material.model';

@Table({
    tableName: 'product_materials',
    timestamps: false,
})
export class ProductMaterial extends Model {
    @PrimaryKey
    @ForeignKey(() => Product)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    productId: string;

    @ForeignKey(() => Material)
    @Column({
        type: DataTypes.UUID,
        allowNull: false,
    })
    materialId: string;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
    })
    quantity: number;
}
