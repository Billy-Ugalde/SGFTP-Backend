import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../entities/bank-account.entity';
import { GoogleDriveService } from '../../google-drive/google-drive.service';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async create(file?: Express.Multer.File): Promise<BankAccount> {
    try {
      const newAccount = this.bankAccountRepository.create();
      const savedAccount = await this.bankAccountRepository.save(newAccount);

      if (file) {
        const folderName = `bank_${savedAccount.id_bank_account}`;
        const { url } = await this.googleDriveService.uploadFile(file, folderName);
        savedAccount.image_url = url;
        await this.bankAccountRepository.save(savedAccount);
      }

      return savedAccount;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error creando cuenta bancaria: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  async findAll(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
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

  async update(id: number, file?: Express.Multer.File): Promise<BankAccount> {
    try {
      const account = await this.findOne(id);

      if (file) {
        if (account.image_url && account.image_url.trim() !== '') {
          const fileId = this.googleDriveService.extractFileIdFromUrl(account.image_url);
          if (fileId) {
            await this.googleDriveService.deleteFile(fileId);
          }
        }

        const folderName = `bank_${account.id_bank_account}`;
        const { url } = await this.googleDriveService.uploadFile(file, folderName);
        account.image_url = url;
        await this.bankAccountRepository.save(account);
      }

      return account;
    } catch (error) {
      throw new InternalServerErrorException(
        `Error actualizando cuenta bancaria: ${error.message || 'Error desconocido'}`,
      );
    }
  }

  async remove(id: number): Promise<void> {
    const account = await this.findOne(id);

    if (account.image_url) {
      const fileId = this.googleDriveService.extractFileIdFromUrl(account.image_url);
      if (fileId) {
        await this.googleDriveService.deleteFile(fileId);
      }
    }

    await this.bankAccountRepository.remove(account);
  }
}
