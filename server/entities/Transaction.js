import { EntitySchema } from 'typeorm';

export const TransactionSchema = new EntitySchema({
  name: 'Transaction',
  tableName: 'transaction',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    title: { type: 'varchar' },
    subtitle: { type: 'varchar', nullable: true }, // e.g., 'Today, 10:30 AM' or 'Yesterday'
    amount: { type: 'decimal', precision: 10, scale: 2 },
    type: { type: 'varchar' }, // 'income' or 'expense'
    category: { type: 'varchar', nullable: true }, // to determine icon
    payment_method: { type: 'varchar', nullable: true }, // efectivo, transferencia, credito X, debito, mixto
    date: { type: 'timestamptz', nullable: true } // actual date of the transaction
  },
  relations: {
    professional: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'professional_id' },
      nullable: true
    }
  }
});
