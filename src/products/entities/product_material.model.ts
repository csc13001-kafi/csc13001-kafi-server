import {
    Column,
    Model,
    Table,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Product } from './product.model';
import { Material } from '../../materials/entities/material.model';

@Table({
    tableName: 'product_materials',
    timestamps: false,
})
export class ProductMaterial extends Model {
    @Column({
        primaryKey: true,
        unique: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
    })
    declare id: string;

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

    @BelongsTo(() => Product)
    product: Product;

    @BelongsTo(() => Material)
    material: Material;
}
