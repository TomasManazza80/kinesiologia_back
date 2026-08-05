import { AppDataSource } from '../database.js';

export const getSpecialties = async (req, res) => {
    try {
        const specialtyRepo = AppDataSource.getRepository('Specialty');
        const specialties = await specialtyRepo.find({ order: { name: 'ASC' } });
        res.json({ success: true, data: specialties });
    } catch (error) {
        console.error('Error fetching specialties:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createSpecialty = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'El nombre de la especialidad es requerido' });
        }
        
        const specialtyRepo = AppDataSource.getRepository('Specialty');
        
        // Check if exists
        const existing = await specialtyRepo.findOne({ where: { name: name.trim() } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'La especialidad ya existe' });
        }

        const newSpecialty = specialtyRepo.create({ name: name.trim() });
        const savedSpecialty = await specialtyRepo.save(newSpecialty);
        
        res.status(201).json({ success: true, data: savedSpecialty });
    } catch (error) {
        console.error('Error creating specialty:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const updateSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'El nombre de la especialidad es requerido' });
        }
        
        const specialtyRepo = AppDataSource.getRepository('Specialty');
        const userRepo = AppDataSource.getRepository('User');
        
        const specialty = await specialtyRepo.findOne({ where: { id: parseInt(id) } });
        if (!specialty) {
            return res.status(404).json({ success: false, message: 'Especialidad no encontrada' });
        }

        const existing = await specialtyRepo.findOne({ where: { name: name.trim() } });
        if (existing && existing.id !== parseInt(id)) {
            return res.status(400).json({ success: false, message: 'La especialidad ya existe' });
        }

        const oldName = specialty.name;
        specialty.name = name.trim();
        await specialtyRepo.save(specialty);

        // Update users that have this specialty
        const users = await userRepo.find();
        for (let user of users) {
            if (user.specialty && user.specialty.includes(oldName)) {
                user.specialty = user.specialty.map(s => s === oldName ? specialty.name : s);
                await userRepo.save(user);
            }
        }
        
        res.json({ success: true, data: specialty });
    } catch (error) {
        console.error('Error updating specialty:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const deleteSpecialty = async (req, res) => {
    try {
        const { id } = req.params;
        const specialtyRepo = AppDataSource.getRepository('Specialty');
        const userRepo = AppDataSource.getRepository('User');
        
        const specialty = await specialtyRepo.findOne({ where: { id: parseInt(id) } });
        if (!specialty) {
            return res.status(404).json({ success: false, message: 'Especialidad no encontrada' });
        }

        const oldName = specialty.name;
        await specialtyRepo.remove(specialty);

        // Remove specialty from users
        const users = await userRepo.find();
        for (let user of users) {
            if (user.specialty && user.specialty.includes(oldName)) {
                user.specialty = user.specialty.filter(s => s !== oldName);
                await userRepo.save(user);
            }
        }
        
        res.json({ success: true, message: 'Especialidad eliminada' });
    } catch (error) {
        console.error('Error deleting specialty:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
