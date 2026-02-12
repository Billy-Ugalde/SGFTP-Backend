import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorService } from './donor.service';
import { DonorController } from './controllers/donor.controller';
import { Donor } from './entities/donor.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donor]),
    AuthModule,
  ],
  controllers: [DonorController],
  providers: [DonorService],
  exports: [DonorService],
})
export class DonorModule {}
