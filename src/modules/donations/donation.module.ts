import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonationService } from './donation.service';
import { DonationController } from './controllers/donation.controller';
import { BankAccountController } from './controllers/bank-account.controller';
import { BankAccountService } from './services/bank-account.service';
import { Donor } from './entities/donor.entity';
import { Donation } from './entities/donation.entity';
import { BankAccount } from './entities/bank-account.entity';
import { AuthModule } from '../auth/auth.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donor, Donation, BankAccount]),
    AuthModule,
    GoogleDriveModule,
    SharedModule,
  ],
  controllers: [DonationController, BankAccountController],
  providers: [DonationService, BankAccountService],
  exports: [DonationService, BankAccountService],
})
export class DonationModule {}
