import axios from 'axios';

const GVAMAX_API_URL = process.env.GVAMAX_API_URL || 'https://api.gvamax.com/v1';

/**
 * Publicar o actualizar propiedad en GVAmax
 * @param {Object} property Datos de la propiedad local
 */
export async function uploadToGvamax(property) {
    try {
        console.log(`[GVAmax API] Iniciando sincronización de propiedad ID: ${property.id}...`);

        const payload = {
            id: property.id,
            title: property.title || 'Sin Título',
            description: property.description || '',
            price: property.marketPrice || 0,
            currency: property.currency || 'USD',
            address: `${property.street || ''} ${property.streetNumber || ''}`,
            city: property.city || '',
            state: property.state || '',
            country: property.country || '',
            images: property.images?.map(img => img.imageUrl) || []
        };

        console.log(`[GVAmax API] Payload preparado:`, JSON.stringify(payload, null, 2));

        /*
        const response = await axios.post(`${GVAMAX_API_URL}/properties`, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.GVAMAX_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`[GVAmax API] Éxito:`, response.data);
        return response.data;
        */
       
        console.log(`[GVAmax API] SIMULACIÓN EXITOSA. La propiedad ${property.id} fue (teóricamente) enviada.`);
        return { status: 'mock_success' };
    } catch (error) {
        console.error(`[GVAmax API] Error publicando propiedad:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Dar de baja propiedad en GVAmax
 * @param {string|number} propertyId ID de la propiedad local
 */
export async function deleteFromGvamax(propertyId) {
    try {
        console.log(`[GVAmax API] Eliminando propiedad ID: ${propertyId}...`);
        
        /*
        await axios.delete(`${GVAMAX_API_URL}/properties/${propertyId}`, {
             headers: {
                'Authorization': `Bearer ${process.env.GVAMAX_API_KEY}`,
            }
        });
        */
       
        console.log(`[GVAmax API] SIMULACIÓN EXITOSA. Propiedad dada de baja.`);
        return { status: 'mock_deleted' };
    } catch (error) {
         console.error(`[GVAmax API] Error eliminando propiedad:`, error.response?.data || error.message);
    }
}

const API_URL = process.env.GVAMAX_API_URL || 'https://gvamax.ar/Api/v3';
const ID = process.env.GVAMAX_ID;
const TOKEN = process.env.GVAMAX_TOKEN;

async function fetchGvamax(endpoint, method = 'GET', extraParams = {}) {
    try {
        const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
        const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        const url = new URL(`${baseUrl}${finalEndpoint}`);
        
        const params = {
            id: ID,
            token: TOKEN,
            ...extraParams
        };
        
        if (method === 'GET') {
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        }

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`GVAmax API Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching from GVAmax [${endpoint}]:`, error);
        throw error;
    }
}

// Inmuebles
export const getInmuebles = async (params) => fetchGvamax('/inmuebles', 'GET', params);
export const getTiposInmuebles = async (params) => fetchGvamax('/buscador/Tipos', 'GET', params);
export const getFullLocation = async (params) => fetchGvamax('/buscador/FullLocation', 'GET', params);
export const getBarrios = async (params) => fetchGvamax('/Buscador/Barrios', 'GET', params);
export const getLocalidades = async (params) => fetchGvamax('/Buscador/Localidades', 'GET', params);
export const getProvincias = async (params) => fetchGvamax('/Buscador/Provincias', 'GET', params);
export const getZonas = async (params) => fetchGvamax('/Zonas/', 'GET', params);
export const getLimitesZona = async (params) => fetchGvamax('/Zonas/Limites', 'GET', params);
export const getEmprendimientos = async (params) => fetchGvamax('/empendimientos', 'GET', params);
export const getCrmList = async (params) => fetchGvamax('/CRM/list/', 'GET', params);
export const getCrmUsuarios = async (params) => fetchGvamax('/CRM/usuarios/', 'GET', params);
export const getCrmCarpetas = async (params) => fetchGvamax('/CRM/carpetas/', 'GET', params);
export const getCrmGrupos = async (params) => fetchGvamax('/CRM/grupos/', 'GET', params);
export const getCrmCiclos = async (params) => fetchGvamax('/CRM/ciclos/', 'GET', params);
export const addCrmLead = async (params) => fetchGvamax('/crm/addlead', 'GET', params);
