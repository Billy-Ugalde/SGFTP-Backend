import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CurrencyType } from '../enums/bank-account.enum';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn()
  id_bank_account: number;

  @Column({ type: 'varchar', length: 255 })
  bank_name: string;

  @Column({
    type: 'enum',
    enum: CurrencyType,
    nullable: false,
  })
  currency: CurrencyType;

  @Column({ type: 'varchar', length: 100 })
  account_number: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
