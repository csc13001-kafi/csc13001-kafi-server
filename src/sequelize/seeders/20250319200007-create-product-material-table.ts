import { QueryInterface, QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export = {
    async up(queryInterface: QueryInterface) {
        // Fetch products (selecting id and name)
        const products: any[] = await queryInterface.sequelize.query(
            `SELECT id, name FROM products`,
            { type: QueryTypes.SELECT },
        );
        // Fetch materials (selecting id and name)
        const materials: any[] = await queryInterface.sequelize.query(
            `SELECT id, name FROM materials`,
            { type: QueryTypes.SELECT },
        );

        // Build lookup maps for products and materials based on their names
        const productMap: Record<string, string> = {};
        products.forEach((p: any) => {
            productMap[p.name] = p.id;
        });

        const materialMap: Record<string, string> = {};
        materials.forEach((m: any) => {
            materialMap[m.name] = m.id;
        });

        // Define join records for product-material relationships.
        // Adjust the product and material names to match your seeded data.
        const joinRecords = [
            // For example, Product A uses materials: "sữa" and "đường"
            {
                id: uuidv4(),
                productId: productMap['Product A'],
                materialId: materialMap['sữa'],
                quantity: 50,
            },
            {
                id: uuidv4(),
                productId: productMap['Product A'],
                materialId: materialMap['đường'],
                quantity: 10,
            },
            // Product B uses: "cà phê" and "đường"
            {
                id: uuidv4(),
                productId: productMap['Product B'],
                materialId: materialMap['cà phê'],
                quantity: 20,
            },
            {
                id: uuidv4(),
                productId: productMap['Product B'],
                materialId: materialMap['đường'],
                quantity: 5,
            },
            // Product C uses: "trà" and "bột cacao"
            {
                id: uuidv4(),
                productId: productMap['Product C'],
                materialId: materialMap['trà'],
                quantity: 30,
            },
            {
                id: uuidv4(),
                productId: productMap['Product C'],
                materialId: materialMap['bột cacao'],
                quantity: 5,
            },
        ].filter((record) => record.productId && record.materialId); // Filter out any records with missing references

        await queryInterface.bulkInsert('product_materials', joinRecords);
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.bulkDelete('product_materials', null, {});
    },
};
