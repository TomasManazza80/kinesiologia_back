import * as userService from '../services/userService.js';

export async function getUser(req, res) {
    try {
        const user = await userService.getUserById(req.user.userId);

        if (!user) {
            return res.status(401).json({ message: "Invalid user" });
        }

        res.status(200).json({data: user });
    }
    catch (error) {
        console.error("Error in getUser:", error);
        res.status(500).json({ message: "Error getting user" });
    }
}

export async function getProfessionals(req, res) {
    try {
        const professionals = await userService.getProfessionals();
        res.status(200).json({ data: professionals });
    } catch (error) {
        console.error("Error in getProfessionals:", error);
        res.status(500).json({ message: "Error getting professionals" });
    }
}

export async function updateUser(req, res) {
    try {
        const updatedUser = await userService.updateUser(req.user.userId, req.body);
        res.status(200).json({data: updatedUser });
    }
    catch (error) {
        res.status(500).json({ message: "Error updating user" });
    }
}

export async function deleteUser(req, res) {
    try {
        await userService.deleteUser(req.user.userId);
        res.status(200).json({ message: "User deleted" });
    }
    catch (error) {
        res.status(500).json({ message: "Error deleting user" });
    }
}

// ADMIN ENDPOINTS

export async function getAllUsers(req, res) {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({ data: users });
    } catch (error) {
        res.status(500).json({ message: "Error getting users" });
    }
}

export async function adminCreateUser(req, res) {
    try {
        const newUser = await userService.createUser(req.body);
        res.status(201).json({ message: "User created successfully", data: newUser });
    } catch (error) {
        if (error.code === '23505') {
            res.status(409).json({ message: 'User with that email already exists' });
        } else {
            console.error(error);
            res.status(500).json({ message: "Error creating user" });
        }
    }
}

export async function adminUpdateUser(req, res) {
    const { id } = req.params;
    try {
        const updatedUser = await userService.updateUser(parseInt(id), req.body);
        res.status(200).json({ message: "User updated successfully", data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user" });
    }
}

export async function adminDeleteUser(req, res) {
    const { id } = req.params;
    try {
        await userService.deleteUser(parseInt(id));
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting user" });
    }
}

export async function updateUserRole(req, res) {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role) {
        return res.status(400).json({ message: "Role is required" });
    }

    try {
        const updatedUser = await userService.updateUserRole(parseInt(id), role);
        res.status(200).json({ message: "User role updated", data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Error updating user role" });
    }
}