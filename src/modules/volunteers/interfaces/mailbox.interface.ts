import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";
import { Mailbox } from "../entities/mailbox.entity";

export interface MailboxFiles {
  documents?: Express.Multer.File[];
  Document1_file?: Express.Multer.File[];
  Document2_file?: Express.Multer.File[];
  Document3_file?: Express.Multer.File[];
}

export interface IMailboxService {
  createMailbox(createMailboxDto: CreateMailboxDto, documents?: Express.Multer.File[]): Promise<Mailbox>;
  updateMailbox(id_mailbox: number, updateMailboxDto: UpdateMailboxDto, files?: MailboxFiles): Promise<Mailbox>;
  getMailboxById(id_mailbox: number): Promise<Mailbox>;
  getAllMailbox(): Promise<Mailbox[]>;
}