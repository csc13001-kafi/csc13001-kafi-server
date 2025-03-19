import { Column, Model, Table, ForeignKey } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Product } from './product.model';
import { Material } from '../../materials/entities/material.model';

@Table({
    tableName: 'product_materials',
    timestamps: false,
})
export class ProductMaterial extends Model {
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
}
