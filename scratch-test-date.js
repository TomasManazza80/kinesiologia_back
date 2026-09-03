import { format, isValid } from 'date-fns';
import es from 'date-fns/locale/es/index.js';

try {
    const aptDate = new Date();
    const isValidDate = isValid(aptDate);
    const dateStr = isValidDate ? format(aptDate, "dd 'de' MMMM", { locale: es }) : 'N/A';
    console.log("Success:", dateStr);
} catch (error) {
    console.error("Error:", error.message);
}
