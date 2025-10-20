import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";
import { Mailbox } from "../entities/mailbox.entity";

export interface IMailboxService {
  createMailbox(createMailboxDto: CreateMailboxDto): Promise<Mailbox>;
  updateMailbox(id_mailbox: number, updateMailboxDto: UpdateMailboxDto): Promise<Mailbox>;
  getMailboxById(id_mailbox: number): Promise<Mailbox>;
  getAllMailbox(): Promise<Mailbox[]>;
}