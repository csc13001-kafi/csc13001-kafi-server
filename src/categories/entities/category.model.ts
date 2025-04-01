import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

@Table({
    tableName: 'categories',
    timestamps: true,
})
export class Category extends Model {
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
        defaultValue: 'Sample Name',
    })
    name: string;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: process.env.DEFAULT_CATEGORY_IMAGE,
    })
    image: string;
}
