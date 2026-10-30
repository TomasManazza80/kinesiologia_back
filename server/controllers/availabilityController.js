import { AppDataSource } from '../database.js';

export const getAvailability = async (req, res) => {
    try {
        let professionalId = req.user.userId;
        if (req.user.role === 'ADMIN' && req.query.professional_id && req.query.professional_id !== 'undefined' && req.query.professional_id !== 'null') {
            const parsed = parseInt(req.query.professional_id);
            if (!isNaN(parsed)) professionalId = parsed;
        }
        const availabilityRepo = AppDataSource.getRepository('Availability');
        const availabilities = await availabilityRepo.find({
            where: { professional: { id: professionalId } }
        });

        const formatted = availabilities.map(item => {
            if (item.is_exception && item.exception_date) {
                const dateStr = item.exception_date instanceof Date
                    ? item.exception_date.toISOString().slice(0, 10)
                    : String(item.exception_date).slice(0, 10);
                return { ...item, exception_date: dateStr };
            }
            return item;
        });

        res.status(200).json({ data: formatted });
    } catch (error) {
        console.error("Error in getAvailability:", error);
        res.status(500).json({ message: "Error getting availability", details: error.message });
    }
};

export const saveAvailability = async (req, res) => {
    try {
        let professionalId = req.user.userId;
        if (req.user.role === 'ADMIN' && req.body.professional_id) {
            const parsed = parseInt(req.body.professional_id);
            if (!isNaN(parsed)) professionalId = parsed;
        }
        const { schedules, exceptions } = req.body; // schedules: array of {day_of_week, start_time, end_time}. exceptions: array of {exception_date, exception_title}

        const availabilityRepo = AppDataSource.getRepository('Availability');
        
        // Remove old availability for this professional
        const existing = await availabilityRepo.find({
            where: { professional: { id: professionalId } }
        });
        await availabilityRepo.remove(existing);

        const newAvailabilities = [];

        // Save schedules
        if (schedules && Array.isArray(schedules)) {
            for (const sched of schedules) {
                newAvailabilities.push(
                    availabilityRepo.create({
                        professional: { id: professionalId },
                        day_of_week: sched.day_of_week,
                        start_time: sched.start_time,
                        end_time: sched.end_time,
                        session_duration: sched.session_duration || 30,
                        is_exception: false
                    })
                );
            }
        }

        // Save exceptions
        if (exceptions && Array.isArray(exceptions)) {
            for (const exc of exceptions) {
                const cleanDate = typeof exc.exception_date === 'string'
                    ? exc.exception_date.slice(0, 10)
                    : exc.exception_date;
                newAvailabilities.push(
                    availabilityRepo.create({
                        professional: { id: professionalId },
                        is_exception: true,
                        exception_date: cleanDate,
                        exception_title: exc.exception_title
                    })
                );
            }
        }

        await availabilityRepo.save(newAvailabilities);

        res.status(200).json({ message: "Availability saved successfully", data: newAvailabilities });
    } catch (error) {
        console.error("Error in saveAvailability:", error);
        res.status(500).json({ message: "Error saving availability", details: error.message });
    }
};
