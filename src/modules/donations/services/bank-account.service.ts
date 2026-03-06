import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BankAccount } from '../entities/bank-account.entity';
import { CreateBankAccountDto } from '../dto/create-bank-account.dto';
import { UpdateBankAccountDto } from '../dto/update-bank-account.dto';
import { GoogleDriveService } from '../../google-drive/google-drive.service';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    private readonly googleDriveService: GoogleDriveService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateBankAccountDto,
    file?: Express.Multer.File,
  ): Promise<BankAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newAccount = this.bankAccountRepository.create({ ...dto });
      const savedAccount = await queryRunner.manager.save(
        BankAccount,
        newAccount,
      );

      if (file) {
        const folderName = `bank_${savedAccount.id_bank_account}`;
        const { url } = await this.googleDriveService.uploadFile(
          file,
          folderName,
        );
        savedAccount.image_url = url;
        await queryRunner.manager.save(BankAccount, savedAccount);
      }

      await queryRunner.commitTransaction();
      return savedAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Error creando cuenta bancaria: ${error.message || 'Error desconocido'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      order: { id_bank_account: 'DESC' },
    });
  }

  async findAllActive(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { is_active: true },
      order: { id_bank_account: 'DESC' },
    });
  }

  async findOne(id: number): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({
      where: { id_bank_account: id },
    });
    if (!account) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }
    return account;
  }

  async update(
    id: number,
    dto: UpdateBankAccountDto,
    file?: Express.Multer.File,
  ): Promise<BankAccount> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await this.findOne(id);
      let fileToDelete: string | null = null;

      if (file) {
        const folderName = `bank_${account.id_bank_account}`;

        if (account.image_url && account.image_url.trim() !== '') {
          const fileId = this.googleDriveService.extractFileIdFromUrl(
            account.image_url,
          );
          if (fileId) {
            fileToDelete = fileId;
          }
        }

        const { url } = await this.googleDriveService.uploadFile(
          file,
          folderName,
        );
        account.image_url = url;
      }

      Object.assign(account, dto);
      const updatedAccount = await queryRunner.manager.save(
        BankAccount,
        account,
      );

      await queryRunner.commitTransaction();

      if (fileToDelete) {
        await this.googleDriveService.deleteFile(fileToDelete);
      }

      return updatedAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Error actualizando cuenta bancaria: ${error.message || 'Error desconocido'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number): Promise<void> {
    const account = await this.findOne(id);

    if (account.image_url) {
      const fileId = this.googleDriveService.extractFileIdFromUrl(
        account.image_url,
      );
      if (fileId) {
        await this.googleDriveService.deleteFile(fileId);
      }
    }

    await this.bankAccountRepository.remove(account);
  }
}
