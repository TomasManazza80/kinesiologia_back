process.env.TZ = 'UTC';
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
  const fecha_hora = "2026-09-11T10:08";
  
  const fechaHoraParsed = moment.tz(fecha_hora, 'America/Argentina/Buenos_Aires').toDate();
  console.log("Parsed JS Date:", fechaHoraParsed.toISOString()); // Should be 13:08:00.000Z

  const repo = ds.getRepository('AppointmentTest');
  const appt = await repo.save({ fecha_hora: fechaHoraParsed });
  
  const fetched = await repo.findOne({ where: { id: appt.id } });
  console.log("Fetched Date from DB:", fetched.fecha_hora.toISOString());
  
  await ds.destroy();
}

run().catch(console.error);
