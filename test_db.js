import { DataSource, EntitySchema } from 'typeorm';
import moment from 'moment-timezone';

const ApptSchema = new EntitySchema({
  name: 'AppointmentTest',
  tableName: 'appointment_test',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    fecha_hora: { type: 'timestamp' },
  }
});

const ds = new DataSource({
  type: 'postgres',
  url: 'postgres://postgres:postgres@localhost:5432/postgres', // Update this based on env if needed
  synchronize: true,
  entities: [ApptSchema]
});

async function run() {
  await ds.initialize();
  
  const date = '2026-09-10';
  const time = '10:30';
  const fechaHora = moment.tz(`${date} ${time}`, 'YYYY-MM-DD HH:mm', 'America/Argentina/Buenos_Aires').toDate();
  console.log("Original JS Date:", fechaHora.toISOString()); // Should be 13:30:00.000Z

  const repo = ds.getRepository('AppointmentTest');
  const appt = await repo.save({ fecha_hora: fechaHora });
  
  const fetched = await repo.findOne({ where: { id: appt.id } });
  console.log("Fetched Date from DB:", fetched.fecha_hora.toISOString());
  
  await ds.destroy();
}

run().catch(console.error);
