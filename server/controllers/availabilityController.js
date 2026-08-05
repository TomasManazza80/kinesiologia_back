import { AppDataSource } from '../database.js';

export const getAvailability = async (req, res) => {
    try {
        const professionalId = (req.user.role === 'ADMIN' && req.query.professional_id) ? parseInt(req.query.professional_id) : req.user.userId; // Get requested or logged in professional's ID

        const availabilityRepo = AppDataSource.getRepository('Availability');
        const availabilities = await availabilityRepo.find({
            where: { professional: { id: professionalId } }
        });

        res.status(200).json({ data: availabilities });
    } catch (error) {
        console.error("Error in getAvailability:", error);
        res.status(500).json({ message: "Error getting availability", details: error.message });
    }
};

export const saveAvailability = async (req, res) => {
    try {
        const professionalId = req.user.userId;
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
                newAvailabilities.push(
                    availabilityRepo.create({
                        professional: { id: professionalId },
                        is_exception: true,
                        exception_date: exc.exception_date,
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
