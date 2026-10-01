import { AppDataSource } from '../database.js';

export const getTasks = async (req, res) => {
  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const userId = req.user.userId; // User is attached by authenticateToken

    const tasks = await taskRepo.find({
      where: { professional: { id: userId } },
      order: { createdAt: 'DESC' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const createTask = async (req, res) => {
  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const userId = req.user.userId;
    const { title, due_date, due_time, is_high_priority, status } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'El título es requerido.' });
    }

    const newTask = taskRepo.create({
      title,
      due_date: due_date || 'Hoy',
      due_time,
      is_high_priority: is_high_priority || false,
      status: status || 'pending',
      professional: { id: userId }
    });

    const result = await taskRepo.save(newTask);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const userId = req.user.userId;
    const taskId = req.params.id;

    const task = await taskRepo.findOne({
      where: { id: taskId, professional: { id: userId } }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    taskRepo.merge(task, req.body);
    const result = await taskRepo.save(task);

    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const taskRepo = AppDataSource.getRepository('Task');
    const userId = req.user.userId;
    const taskId = req.params.id;

    const task = await taskRepo.findOne({
      where: { id: taskId, professional: { id: userId } }
    });

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    await taskRepo.remove(task);
    res.json({ message: 'Tarea eliminada exitosamente.' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
