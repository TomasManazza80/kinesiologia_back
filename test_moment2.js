import moment from 'moment-timezone';

const fecha_hora = "2026-09-12T11:30";
const parsed1 = moment.tz(fecha_hora, 'America/Argentina/Buenos_Aires').toISOString();
console.log("Parsed JS Date (no format):", parsed1);

const parsed2 = moment.tz(fecha_hora, 'YYYY-MM-DDTHH:mm', 'America/Argentina/Buenos_Aires').toISOString();
console.log("Parsed JS Date (with format):", parsed2);
