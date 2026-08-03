import { AppDataSource } from '../database.js';

// Get settings
export const getHeroSettings = async (req, res) => {
    try {
        const settingsRepo = AppDataSource.getRepository('SiteSettings');
        let settings = await settingsRepo.findOne({
            where: { id: 1 }
        });
        
        if (!settings) {
            settings = settingsRepo.create({
                id: 1,
                heroTitle: "Excelencia y Confianza en el Mercado Inmobiliario Santafesino",
                heroSubtitle: "Asesoramiento personalizado con más de 30 años de experiencia.",
                heroHighlight: "Atendido por sus propios dueños.",
                heroImageUrl: "/images/hero-property.jpg",
                heroRatingText: "Altamente Recomendado - 3.9 / 28 Opiniones",
                heroRatingStars: 4,
                homeContent: {
                    heroSubtitle: "carnicería meat",
                    heroTitle: "TRADICIÓN Y SABOR<br />EN CADA CORTE",
                    heroDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
                    heroButtonText: "VER LISTA DE PRECIOS",
                    aboutSubtitle: "NUESTRA CARNICERÍA",
                    aboutTitle: "CALIDAD, CONFIANZA Y LA<br />TRADICIÓN EN EL CRUCE",
                    aboutDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
                    aboutStat1Num: "30",
                    aboutStat1Text: "Años sirviendo a<br />la comunidad",
                    aboutStat2Num: "100%",
                    aboutStat2Text: "Calidad<br />Certificada Local",
                    aboutStat3Num: "36+",
                    aboutStat3Text: "Más de 30 tipos<br />de cortes selectos",
                    historySubtitle: "NUESTRA HISTORIA",
                    historyTitle: "MÁS DE 30 AÑOS DE<br/>TRADICIÓN CARNICERA",
                    historyText1: "Todo comenzó hace más de 30 años, cuando nuestra familia decidió abrir las puertas de un modesto local en el corazón de la ciudad. Con una pasión inquebrantable por la calidad y el servicio al cliente, nos propusimos ofrecer los mejores cortes de carne de la región, trabajando de la mano con productores locales.",
                    historyText2: "A lo largo de los años, <strong>El Cruce Carnes</strong> ha crecido junto a nuestra comunidad. Hemos pasado de ser una pequeña carnicería de barrio a un referente en cortes premium y atención personalizada, manteniendo siempre viva la tradición y el respeto por el oficio de carnicero que nos enseñaron nuestros abuelos.",
                    historyText3: "Hoy, la segunda generación sigue al frente del mostrador, seleccionando cada pieza con el mismo cuidado del primer día. Nuestro compromiso sigue intacto: garantizar que a tu mesa llegue siempre un producto de excelencia que une a las familias en cada comida."
                }
            });
            try {
                await settingsRepo.save(settings);
            } catch (e) {
                if (e.code === '23505') {
                    settings = await settingsRepo.findOne({ where: { id: 1 } });
                } else {
                    throw e;
                }
            }
        }
        
        return res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error("Error fetching hero settings:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateHeroSettings = async (req, res) => {
    try {
        const { heroTitle, heroSubtitle, heroHighlight, heroImageUrl, heroRatingText, heroRatingStars, heroSlides, heroOverlayOpacity, homeContent } = req.body;
        
        // Convert old single fields to a slide if slides are empty
        const defaultSlides = heroSlides && heroSlides.length > 0 ? heroSlides : [
            {
                id: Date.now().toString(),
                imageUrl: heroImageUrl || "/images/hero-property.jpg",
                title: heroTitle || "Excelencia y Confianza en el Mercado Inmobiliario Santafesino",
                subtitle: heroSubtitle || "Asesoramiento personalizado con más de 30 años de experiencia.",
                highlight: heroHighlight || "Atendido por sus propios dueños."
            }
        ];

        const parsedOpacity = heroOverlayOpacity !== undefined ? parseInt(heroOverlayOpacity, 10) : 50;
        const parsedStars = heroRatingStars ? parseFloat(heroRatingStars) : 4;

        const settingsRepo = AppDataSource.getRepository('SiteSettings');
        let settings = await settingsRepo.findOne({ where: { id: 1 } });

        if (settings) {
            settings.heroTitle = heroTitle;
            settings.heroSubtitle = heroSubtitle;
            settings.heroHighlight = heroHighlight;
            settings.heroImageUrl = heroImageUrl;
            settings.heroRatingText = heroRatingText;
            settings.heroRatingStars = parsedStars;
            settings.heroSlides = defaultSlides;
            settings.heroOverlayOpacity = parsedOpacity;
            if (homeContent !== undefined) {
                settings.homeContent = homeContent;
            }
            await settingsRepo.save(settings);
        } else {
            settings = settingsRepo.create({
                id: 1,
                heroTitle: heroTitle || "Excelencia y Confianza en el Mercado Inmobiliario Santafesino",
                heroSubtitle: heroSubtitle || "Asesoramiento personalizado con más de 30 años de experiencia.",
                heroHighlight: heroHighlight || "Atendido por sus propios dueños.",
                heroImageUrl: heroImageUrl || "/images/hero-property.jpg",
                heroRatingText: heroRatingText || "Altamente Recomendado - 3.9 / 28 Opiniones",
                heroRatingStars: parsedStars,
                heroSlides: defaultSlides,
                heroOverlayOpacity: parsedOpacity,
                homeContent: homeContent || {
                    heroSubtitle: "carnicería meat",
                    heroTitle: "TRADICIÓN Y SABOR<br />EN CADA CORTE",
                    heroDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                    heroButtonText: "VER LISTA DE PRECIOS",
                    aboutSubtitle: "NUESTRA CARNICERÍA",
                    aboutTitle: "CALIDAD, CONFIANZA Y LA<br />TRADICIÓN EN EL CRUCE",
                    aboutDescription: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo.",
                    aboutStat1Num: "30",
                    aboutStat1Text: "Años sirviendo a<br />la comunidad",
                    aboutStat2Num: "100%",
                    aboutStat2Text: "Calidad<br />Certificada Local",
                    aboutStat3Num: "36+",
                    aboutStat3Text: "Más de 30 tipos<br />de cortes selectos",
                    historySubtitle: "NUESTRA HISTORIA",
                    historyTitle: "MÁS DE 30 AÑOS DE<br/>TRADICIÓN CARNICERA",
                    historyText1: "Todo comenzó hace más de 30 años...",
                    historyText2: "A lo largo de los años...",
                    historyText3: "Hoy, la segunda generación..."
                }
            });
            await settingsRepo.save(settings);
        }
        
        return res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error("Error updating hero settings:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
