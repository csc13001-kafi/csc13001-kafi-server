import { QueryInterface, QueryTypes } from 'sequelize';

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
                productId: productMap['Product A'],
                materialId: materialMap['sữa'],
                quantity: 50,
            },
            {
                productId: productMap['Product A'],
                materialId: materialMap['đường'],
                quantity: 10,
            },
            // Product B uses: "cà phê" and "đường"
            {
                productId: productMap['Product B'],
                materialId: materialMap['cà phê'],
                quantity: 20,
            },
            {
                productId: productMap['Product B'],
                materialId: materialMap['đường'],
                quantity: 5,
            },
            // Product C uses: "trà" and "bột cacao"
            {
                productId: productMap['Product C'],
                materialId: materialMap['trà'],
                quantity: 30,
            },
            {
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
