import { Queue } from 'bullmq';

export const gvamaxQueue = new Queue('gvamax-sync', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    retryStrategy: function() {
      // Devolver null desactiva los reintentos automáticos para no bloquear el backend ni hacer spam
      return null;
    }
  }
});

gvamaxQueue.on('error', err => {
  // Solo avisar de error pero no tumbar el servidor (se loguea una vez)
  console.log('[Info] GVAmax no está disponible: no se pudo conectar a Redis. La app seguirá funcionando sin sincronización.');
});

export async function addPropertySyncJob(propertyId) {
  try {
    await gvamaxQueue.add(`sync-${propertyId}`, { propertyId }, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000 // 5s, 10s, 20s, 40s...
      }
    });
  } catch (err) {
    console.error('Error adding job to GVAmax queue:', err.message);
  }
}
