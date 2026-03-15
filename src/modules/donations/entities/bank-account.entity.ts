import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn()
  id_bank_account: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url?: string;
}
