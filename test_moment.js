import moment from 'moment-timezone';
import { DataSource, EntitySchema } from 'typeorm';

const ApptSchema = new EntitySchema({
  name: 'AppointmentTest',
  tableName: 'appointment_test',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    fecha_hora: { type: 'timestamptz' },
  }
});

const ds = new DataSource({
  type: 'postgres',
  url: 'postgresql://kinesiologiadatabase_user:7wl90MW1nGxH3Wl1ohyAzXinIwFtsTQm@dpg-d9oehk2jnfac73dk0b30-a.oregon-postgres.render.com/kinesiologiadatabase',
  ssl: { rejectUnauthorized: false },
  entities: [ApptSchema]
});

async function run() {
  await ds.initialize();
  await ds.query(`CREATE TABLE IF NOT EXISTS appointment_test (id SERIAL PRIMARY KEY, fecha_hora timestamptz)`);
  
  const fechaHoraParsed = moment.tz("2026-09-11T10:08", 'America/Argentina/Buenos_Aires');
  
  // Pass ISO string instead of Date
  const isoString = fechaHoraParsed.toISOString();
  console.log("Saving ISO String:", isoString);

  const repo = ds.getRepository('AppointmentTest');
  const appt = await repo.save({ fecha_hora: isoString }); // Pass string!
  
  const fetched = await repo.findOne({ where: { id: appt.id } });
  console.log("Fetched Date from DB:", fetched.fecha_hora.toISOString());
  
  await ds.destroy();
}

run().catch(console.error);
