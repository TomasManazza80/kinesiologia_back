import { Worker } from 'bullmq';
import axios from 'axios';
import { AppDataSource } from '../database.js';

const worker = new Worker('gvamax-sync', async (job) => {
  const { propertyId } = job.data;
  
  const propertyRepo = AppDataSource.getRepository('RealEstateObject');

  // Cambiar estado a pendiente
  await propertyRepo.update(propertyId, { gvamax_sync_status: 'PENDING', gvamax_sync_error: null });

  const property = await propertyRepo.findOne({ where: { id: propertyId } });
  if (!property) return;

  try {
    // Petición saliente hacia la API de GVAmax
    await axios.post('https://api.gvamax.com/v1/properties', property, {
      headers: { 'Authorization': `Bearer ${process.env.GVAMAX_API_KEY}` }
    });

    // Guardar éxito en auditoría
    await propertyRepo.update(propertyId, { gvamax_sync_status: 'SUCCESS' });
  } catch (error) {
    // Si se agotan los reintentos automáticos de BullMQ, registrar el error definitivo en BD
    if (job.attemptsMade >= job.opts.attempts - 1) { // -1 o ==, dependiendo de la versión de BullMQ, job.attemptsMade cuenta los reintentos
      await propertyRepo.update(propertyId, { 
        gvamax_sync_status: 'FAILED',
        gvamax_sync_error: error.response?.data?.message || error.message
      });
    }
    throw error; // Lanzar el error para que BullMQ ejecute el backoff exponencial
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    retryStrategy: function() {
      return null;
    }
  }
});

worker.on('error', err => {
  // Solo avisar de error pero no tumbar el servidor
  console.log('[Info] GVAmax Worker no está disponible: no se pudo conectar a Redis.');
});

console.log('Worker de GVAmax corriendo activamente...');
