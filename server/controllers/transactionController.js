import { AppDataSource } from '../database.js';
import moment from 'moment';

export const getBalance = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { filter = 'Mes' } = req.query;
        
        const transactionRepo = AppDataSource.getRepository('Transaction');

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
            .where('COALESCE(transaction.date, transaction.created_at) BETWEEN :start AND :end', { start: startDate, end: endDate })
            .andWhere('transaction.professional_id = :userId', { userId });

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
        const { title, subtitle, amount, type, category, paymentMethod, date } = req.body;

        if (!title || !amount || !type) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const transactionRepo = AppDataSource.getRepository('Transaction');
        
        const newTransaction = transactionRepo.create({
            title,
            subtitle,
            amount: Number(amount),
            type,
            category,
            payment_method: paymentMethod || null,
            date: date ? new Date(date) : new Date(),
            professional: { id: userId }
        });

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
        const { offset = 0, limit = 50 } = req.query;
        
        const transactionRepo = AppDataSource.getRepository('Transaction');
        const endDate = moment().endOf('day').toDate();
        // Obtenemos transacciones desde siempre hasta la fecha actual
        
        const queryBuilder = transactionRepo.createQueryBuilder('transaction')
            .where('transaction.created_at <= :end', { end: endDate })
            .andWhere('transaction.professional_id = :userId', { userId });

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

export const updateTransaction = async (req, res) => {
    try {
        const { role, userId } = req.user;
        const { id } = req.params;
        const { title, subtitle, amount, type, category, paymentMethod, date } = req.body;

        const transactionRepo = AppDataSource.getRepository('Transaction');
        
        const transaction = await transactionRepo.findOne({
            where: { id: parseInt(id) },
            relations: { professional: true }
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transacción no encontrada" });
        }

        if (transaction.professional?.id !== userId) {
            return res.status(403).json({ message: "No tienes permiso para editar esta transacción" });
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
