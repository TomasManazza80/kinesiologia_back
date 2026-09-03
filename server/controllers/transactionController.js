import { AppDataSource } from '../database.js';
import moment from 'moment';

export const getBalance = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { filter = 'Mes', scope = 'personal' } = req.query;

        if (scope === 'group' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Acceso denegado: Solo los administradores pueden ver el balance grupal" });
        }
        
        const repoName = scope === 'group' ? 'GroupTransaction' : 'Transaction';
        const transactionRepo = AppDataSource.getRepository(repoName);

        let startDate;
        let endDate = moment().endOf('day').toDate();

        switch(filter) {
            case 'Dia':
                startDate = moment().startOf('day').toDate();
                break;
            case 'Semana':
                startDate = moment().startOf('isoWeek').toDate();
                break;
            case 'Mes':
            default:
                startDate = moment().startOf('month').toDate();
                break;
        }

        const queryBuilder = transactionRepo.createQueryBuilder('transaction')
            .where('COALESCE(transaction.date, transaction.created_at) BETWEEN :start AND :end', { start: startDate, end: endDate });

        if (scope === 'group') {
            queryBuilder.leftJoinAndSelect('transaction.createdBy', 'user');
        } else {
            queryBuilder.leftJoinAndSelect('transaction.professional', 'professional')
                        .andWhere('transaction.professional_id = :userId', { userId });
        }

        const transactions = await queryBuilder.orderBy('COALESCE(transaction.date, transaction.created_at)', 'DESC').getMany();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += Number(t.amount);
            } else if (t.type === 'expense') {
                totalExpense += Number(t.amount);
            }
        });

        const totalBalance = totalIncome - totalExpense;

        res.json({
            totalBalance,
            totalIncome,
            totalExpense,
            transactions
        });
    } catch (error) {
        console.error("Error al obtener balance:", error);
        res.status(500).json({ message: "Error interno del servidor", details: error.message });
    }
};

export const createTransaction = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { title, subtitle, amount, type, category, paymentMethod, date, isGroup, is_group, scope } = req.body;

        if (!title || !amount || !type) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const isGroupTx = isGroup === true || is_group === true || scope === 'group';

        if (isGroupTx && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Acceso denegado: Solo los administradores pueden registrar transacciones grupales" });
        }

        const repoName = isGroupTx ? 'GroupTransaction' : 'Transaction';
        const transactionRepo = AppDataSource.getRepository(repoName);
        
        const newTransaction = transactionRepo.create({
            title,
            subtitle,
            amount: Number(amount),
            type,
            category,
            payment_method: paymentMethod || null,
            date: date ? new Date(date) : new Date()
        });

        if (isGroupTx) {
            newTransaction.createdBy = { id: userId };
        } else {
            newTransaction.professional = { id: userId };
        }

        await transactionRepo.save(newTransaction);
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error("Error al crear transacción:", error);
        res.status(500).json({ message: "Error interno del servidor", details: error.message });
    }
};

export const getTransactionHistory = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { offset = 0, limit = 50, scope = 'personal' } = req.query;

        if (scope === 'group' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Acceso denegado: Solo los administradores pueden ver el historial grupal" });
        }
        
        const repoName = scope === 'group' ? 'GroupTransaction' : 'Transaction';
        const transactionRepo = AppDataSource.getRepository(repoName);
        const endDate = moment().endOf('day').toDate();
        
        const queryBuilder = transactionRepo.createQueryBuilder('transaction')
            .where('transaction.created_at <= :end', { end: endDate });

        if (scope === 'group') {
            queryBuilder.leftJoinAndSelect('transaction.createdBy', 'user');
        } else {
            queryBuilder.leftJoinAndSelect('transaction.professional', 'professional')
                        .andWhere('transaction.professional_id = :userId', { userId });
        }

        const [transactions, total] = await queryBuilder
            .orderBy('COALESCE(transaction.date, transaction.created_at)', 'DESC')
            .skip(parseInt(offset))
            .take(parseInt(limit))
            .getManyAndCount();

        res.json({
            data: transactions,
            total,
            offset: parseInt(offset),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Error al obtener historial de transacciones:", error);
        res.status(500).json({ message: "Error interno del servidor", details: error.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        const rawId = req.user?.userId || req.user?.id;
        const userId = rawId ? parseInt(rawId) : null;
        const { role } = req.user;
        const { startDate, endDate, scope = 'personal' } = req.query;

        if (scope === 'group' && role !== 'ADMIN' && role !== 'SUPERADMIN') {
            return res.status(403).json({ message: "Acceso denegado: Solo los administradores pueden ver egresos grupales" });
        }

        const repoName = scope === 'group' ? 'GroupTransaction' : 'Transaction';
        const transactionRepo = AppDataSource.getRepository(repoName);
        let queryBuilder = transactionRepo.createQueryBuilder('transaction')
            .where('transaction.type = :type', { type: 'expense' });

        if (scope === 'group') {
            queryBuilder.leftJoinAndSelect('transaction.createdBy', 'user');
        } else {
            queryBuilder.leftJoinAndSelect('transaction.professional', 'professional')
                        .andWhere('transaction.professional_id = :userId', { userId });
        }

        if (startDate && endDate) {
            const start = moment(startDate).startOf('day').toDate();
            const end = moment(endDate).endOf('day').toDate();
            queryBuilder = queryBuilder.andWhere('COALESCE(transaction.date, transaction.created_at) BETWEEN :start AND :end', { start, end });
        } else if (startDate) {
            const start = moment(startDate).startOf('day').toDate();
            queryBuilder = queryBuilder.andWhere('COALESCE(transaction.date, transaction.created_at) >= :start', { start });
        } else if (endDate) {
            const end = moment(endDate).endOf('day').toDate();
            queryBuilder = queryBuilder.andWhere('COALESCE(transaction.date, transaction.created_at) <= :end', { end });
        }

        const expenses = await queryBuilder
            .orderBy('COALESCE(transaction.date, transaction.created_at)', 'DESC')
            .getMany();

        const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

        res.json({
            data: expenses,
            totalExpenses,
            count: expenses.length
        });
    } catch (error) {
        console.error("Error al obtener egresos por rango:", error);
        res.status(500).json({ message: "Error interno del servidor", details: error.message });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { id } = req.params;
        const { title, subtitle, amount, type, category, paymentMethod, date, isGroup, is_group, scope } = req.body;

        const isGroupTx = isGroup === true || is_group === true || scope === 'group';
        const repoName = isGroupTx ? 'GroupTransaction' : 'Transaction';
        const transactionRepo = AppDataSource.getRepository(repoName);
        
        const findOptions = {
            where: { id: parseInt(id) },
            relations: isGroupTx ? { createdBy: true } : { professional: true }
        };

        const transaction = await transactionRepo.findOne(findOptions);

        if (!transaction) {
            return res.status(404).json({ message: "Transacción no encontrada" });
        }

        if (isGroupTx) {
            if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
                return res.status(403).json({ message: "No tienes permiso para editar esta transacción grupal" });
            }
        } else {
            if (transaction.professional?.id !== userId && role !== 'ADMIN' && role !== 'SUPERADMIN') {
                return res.status(403).json({ message: "No tienes permiso para editar esta transacción personal" });
            }
        }

        if (title !== undefined) transaction.title = title;
        if (subtitle !== undefined) transaction.subtitle = subtitle;
        if (amount !== undefined) transaction.amount = Number(amount);
        if (type !== undefined) transaction.type = type;
        if (category !== undefined) transaction.category = category;
        if (paymentMethod !== undefined) transaction.payment_method = paymentMethod;
        if (date !== undefined) transaction.date = date ? new Date(date) : null;

        await transactionRepo.save(transaction);
        res.json(transaction);
    } catch (error) {
        console.error("Error al actualizar transacción:", error);
        res.status(500).json({ message: "Error interno del servidor", details: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { id } = req.params;
        const { scope = 'personal' } = req.query;

        const isGroupTx = scope === 'group';
        const repoName = isGroupTx ? 'GroupTransaction' : 'Transaction';
        const transactionRepo = AppDataSource.getRepository(repoName);
        
        const findOptions = {
            where: { id: parseInt(id) },
            relations: isGroupTx ? { createdBy: true } : { professional: true }
        };

        const transaction = await transactionRepo.findOne(findOptions);

        if (!transaction) {
            return res.status(404).json({ message: "Transacción no encontrada" });
        }

        if (isGroupTx) {
            if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
                return res.status(403).json({ message: "No tienes permiso para eliminar esta transacción grupal" });
            }
        } else {
            if (transaction.professional?.id !== userId && role !== 'ADMIN' && role !== 'SUPERADMIN') {
                return res.status(403).json({ message: "No tienes permiso para eliminar esta transacción personal" });
            }
        }

        await transactionRepo.remove(transaction);
        res.json({ message: "Transacción eliminada exitosamente" });
    } catch (error) {
        console.error("Error al eliminar transacción:", error);
        res.status(500).json({ message: "Error interno del servidor", details: error.message });
    }
};
