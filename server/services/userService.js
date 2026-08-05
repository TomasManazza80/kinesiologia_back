import { AppDataSource } from '../database.js';
import bcrypt from 'bcryptjs';

function getUserRepo() {
    return AppDataSource.getRepository('User');
}

export async function getAllUsers() {
    return getUserRepo().find({
        select: { id: true, email: true, name: true, role: true, specialty: true, createdAt: true, updatedAt: true }
    });
}

export async function getProfessionals() {
    return getUserRepo().find({
        where: [
            { role: 'EMPLOYEE' },
            { role: 'ADMIN' },
            { role: 'USER' }
        ],
        relations: { patients: true },
        select: { 
            id: true, email: true, name: true, specialty: true, role: true, 
            session_fee: true, require_payment: true, mp_access_token: true, profile_picture: true, is_public: true
        }
    });
}

export async function getUserById(id) {
    return getUserRepo().findOne({
        where: { id },
        relations: { patients: true },
        select: { id: true, email: true, name: true, role: true, specialty: true, session_fee: true, require_payment: true, mp_access_token: true, createdAt: true, updatedAt: true, profile_picture: true, is_public: true }
    });
}

export async function createUser(userData) {
    const { email, password, firstName, lastName, role, specialty } = userData;
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Support both name and firstName/lastName formats
    let finalName = userData.name;
    if (!finalName && (firstName || lastName)) {
        finalName = (firstName || '') + ' ' + (lastName || '');
    }

    const userRepo = getUserRepo();

    let newUser = userRepo.create({
        email,
        password: hashedPassword,
        name: finalName ? finalName.trim() : '',
        role: (role || 'USER').toUpperCase(),
        specialty
    });

    newUser = await userRepo.save(newUser);

    return {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        specialty: newUser.specialty
    };
}

export async function updateUserRole(id, role) {
    await getUserRepo().update(id, { role: role ? role.toUpperCase() : 'USER' });
    return getUserRepo().findOne({
        where: { id },
        select: { id: true, email: true, role: true }
    });
}

export async function updateUser(id, updateData) {
    const allowedFields = [
        'name', 'email', 'role', 'specialty', 'session_fee', 
        'require_payment', 'mp_access_token', 'profile_picture', 'is_public'
    ];

    const cleanData = {};
    for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
            cleanData[field] = updateData[field];
        }
    }

    if (cleanData.role) {
        cleanData.role = cleanData.role.toUpperCase();
    }
    
    await getUserRepo().update(id, cleanData);
    
    return getUserRepo().findOne({
        where: { id },
        select: { id: true, email: true, name: true, role: true, specialty: true, session_fee: true, require_payment: true, mp_access_token: true, profile_picture: true, is_public: true }
    });
}

export async function deleteUser(id) {
    return getUserRepo().delete(id);
}
