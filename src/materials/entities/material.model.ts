import { Column, Model, Table } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

@Table({
    tableName: 'materials',
    timestamps: true,
})
export class Material extends Model {
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
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    orginalStock: number;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    currentStock: number;

    @Column({
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'ml',
    })
    unit: string;

    @Column({
        type: DataTypes.DATE,
        allowNull: false,
    })
    expiredDate: Date;

    @Column({
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    price: number;
}
