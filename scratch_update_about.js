import { AppDataSource } from './server/database.js';

async function updateAbout() {
    try {
        await AppDataSource.initialize();
        console.log("DB connected");

        const repo = AppDataSource.getRepository('SiteSettings');
        const settings = await repo.findOne({ where: { id: 1 } });
        
        if (settings && settings.homeContent) {
            settings.homeContent.aboutTitle = "CALIDAD, CONFIANZA Y LA<br />TRADICIÓN EN EL CRUCE";
            settings.homeContent.aboutDescription = "En El Cruce nos dedicamos a ofrecer las mejores carnes de la región, seleccionadas cuidadosamente de productores locales para garantizar frescura, terneza y un sabor inigualable en cada comida familiar.";
            await repo.save(settings);
            console.log("Updated about text in DB successfully.");
        } else {
            console.log("No settings found to update.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateAbout();
