import { EntitySchema } from 'typeorm';

export const SiteSettingsSchema = new EntitySchema({
  name: 'SiteSettings',
  tableName: 'site_settings',
  columns: {
    id: { primary: true, type: 'int' },
    pageData: { type: 'jsonb', nullable: true },
    // Mantendremos las columnas mencionadas en settingsController.js para evitar errores
    // si alguna otra parte del código aún intenta usarlas.
    heroTitle: { type: 'varchar', nullable: true },
    heroSubtitle: { type: 'varchar', nullable: true },
    heroHighlight: { type: 'varchar', nullable: true },
    heroImageUrl: { type: 'varchar', nullable: true },
    heroRatingText: { type: 'varchar', nullable: true },
    heroRatingStars: { type: 'decimal', nullable: true },
    heroSlides: { type: 'jsonb', nullable: true },
    heroOverlayOpacity: { type: 'int', nullable: true },
    homeContent: { type: 'jsonb', nullable: true }
  }
});
