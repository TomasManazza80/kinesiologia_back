import axios from 'axios';
import { AppDataSource } from '../database.js';

// Diccionario de mapeo según requerimientos estrictos de la API de Argenprop
const ARGENPROP_MAPPING = {
  operationType: { 'Venta': 1, 'Alquiler': 2, 'Alquiler Temporario': 3 },
  propertyType: { 'Departamento': 1, 'Casa': 2, 'Ph': 3, 'Terreno': 4 },
  currency: { 'ARS': 1, 'USD': 2 }
};

/**
 * Valida si la propiedad cuenta con los campos obligatorios para Argenprop
 */
function validateForArgenprop(property) {
  const errors = [];
  if (!property.latitude || !property.longitude) errors.push("Coordenadas GPS (latitud/longitud) obligatorias.");
  if (!property.surfaceTotal) errors.push("La superficie total es obligatoria para Argenprop.");
  if (!ARGENPROP_MAPPING.operationType[property.operationType]) errors.push(`Tipo de operación inválido: ${property.operationType}`);
  if (!ARGENPROP_MAPPING.propertyType[property.propertyType]) errors.push(`Tipo de propiedad inválida: ${property.propertyType}`);
  
  if (errors.length > 0) {
    throw new Error(`Validación Argenprop Fallida: ${errors.join(' | ')}`);
  }
}

/**
 * Mapea el objeto interno al payload estructurado de Argenprop
 */
function mapToArgenpropPayload(property) {
  return {
    id_aviso_externo: property.id.toString(),
    tipo_operacion: ARGENPROP_MAPPING.operationType[property.operationType],
    tipo_inmueble: ARGENPROP_MAPPING.propertyType[property.propertyType],
    precio: property.price || property.marketPrice,
    moneda: ARGENPROP_MAPPING.currency[property.currency],
    descripcion: property.description,
    titulo: property.title,
    coordenadas: {
      lat: property.latitude,
      lon: property.longitude
    },
    caracteristicas: {
      superficie_total: property.surfaceTotal,
      superficie_cubierta: property.surfaceCovered,
      cantidad_ambientes: property.rooms,
      cantidad_banos: property.bathrooms
    }
  };
}

export async function uploadToArgenprop(propertyId) {
  const propertyRepo = AppDataSource.getRepository('RealEstateObject');
  const property = await propertyRepo.findOne({ where: { id: propertyId } });
  if (!property || !property.argenprop_enabled) return;

  try {
    // 1. Validación Estricta Preventiva
    validateForArgenprop(property);

    // 2. Aplicación de la capa de Mapeo
    const payload = mapToArgenpropPayload(property);

    // 3. Envío y captura de respuesta
    const response = await axios.post('https://api.argenprop.com/v1/avisos', payload, {
      headers: { 'Authorization': `Bearer ${process.env.ARGENPROP_API_KEY}` }
    });

    if (response.data && response.data.id_aviso_argenprop) {
      // 4. Guardar id de aviso devuelto por el portal
      await propertyRepo.update(propertyId, { argenprop_id: response.data.id_aviso_argenprop.toString() });
    }
  } catch (error) {
    console.error(`Error en integración Argenprop para ID ${propertyId}:`, error.message);
    throw error;
  }
}

export async function deleteFromArgenprop(propertyId) {
  try {
      console.log(`[Argenprop API] Eliminando propiedad ID: ${propertyId}...`);
      
      await axios.delete(`https://api.argenprop.com/v1/avisos/${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${process.env.ARGENPROP_API_KEY}`
          }
      });
      
      console.log(`[Argenprop API] ÉXITO. Propiedad dada de baja.`);
      return { status: 'deleted' };
  } catch (error) {
        console.error(`[Argenprop API] Error eliminando propiedad:`, error.response?.data || error.message);
  }
}
