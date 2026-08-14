import { EntitySchema } from 'typeorm';

export const GroupTransactionSchema = new EntitySchema({
  name: 'GroupTransaction',
  tableName: 'group_transaction',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    createdAt: { name: 'created_at', type: 'timestamptz', createDate: true },
    updatedAt: { name: 'updated_at', type: 'timestamptz', updateDate: true },
    title: { type: 'varchar' },
    subtitle: { type: 'varchar', nullable: true },
    amount: { type: 'decimal', precision: 10, scale: 2 },
    type: { type: 'varchar' }, // 'income' or 'expense'
    category: { type: 'varchar', nullable: true },
    payment_method: { type: 'varchar', nullable: true },
    date: { type: 'timestamptz', nullable: true }
  },
  relations: {
    createdBy: {
      target: 'User',
      type: 'many-to-one',
      joinColumn: { name: 'created_by_id' },
      nullable: true // We can keep it nullable if there are legacy transactions, but it will be set for new ones.
    }
  }
});
