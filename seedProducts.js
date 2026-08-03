import { AppDataSource } from './server/database.js';

const parsePrice = (priceStr) => {
    return parseFloat(priceStr.replace('$', '').replace(',', ''));
};

const ofertas = [
  { title: 'Vacío (Corte Suave)', price: '$6,500', img: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=400&q=80' },
  { title: 'Bifes (Varios Cortes)', price: '$9,500', img: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=400&q=80' },
  { title: 'Chorizo Artesanal', price: '$6,500', img: 'https://images.unsplash.com/photo-1542365887-1149961dcbce?auto=format&fit=crop&w=400&q=80' },
  { title: 'Polleta de Cerdo', price: '$6,500', img: 'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?auto=format&fit=crop&w=400&q=80' },
];

const destacados = [
  { title: 'Asado de Tira (Ideal Parrilla)', price: '$7,900', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { title: 'Bife de Chorizo (Ideal Parrilla)', price: '$5,900', img: 'https://images.unsplash.com/photo-1607116176195-b81b1f41f536?auto=format&fit=crop&w=400&q=80' },
  { title: 'Bife de Chorizo (Tierno)', price: '$5,900', img: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=400&q=80' },
  { title: 'Pollo Entero (Fresco o Natural)', price: '$6,900', img: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&q=80' },
];

const destacadosVertical = [
  { title: 'Rosio Cheris (Corte de Caza)', price: '$4,900', img: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=400&q=80' },
  // Second item was a repeat of Pollo Entero, skip if it's the same or add it anyway
  { title: 'Pollo Entero (Fresco o Natural) - Vertical', price: '$6,900', img: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=400&q=80' },
];

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected successfully.");
        
        const productRepo = AppDataSource.getRepository('Product');
        
        console.log("Clearing existing products...");
        await productRepo.clear();

        const allProducts = [];

        ofertas.forEach(p => {
            allProducts.push({
                name: p.title,
                pricePerKilo: parsePrice(p.price),
                imageUrl: p.img,
                category: 'Ofertas'
            });
        });

        destacados.forEach(p => {
            allProducts.push({
                name: p.title,
                pricePerKilo: parsePrice(p.price),
                imageUrl: p.img,
                category: 'Destacados'
            });
        });

        destacadosVertical.forEach(p => {
            allProducts.push({
                name: p.title,
                pricePerKilo: parsePrice(p.price),
                imageUrl: p.img,
                category: 'Destacados Vertical'
            });
        });

        console.log("Inserting products...");
        await productRepo.save(allProducts);

        console.log("Products inserted successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    }
}

seed();
