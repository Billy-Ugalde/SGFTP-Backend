import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";
import { Mailbox } from "../entities/mailbox.entity";

export interface IMailboxService {
  createActivity(createMailboxDto: CreateMailboxDto): Promise<Mailbox>
  updateActivity(id_mailbox: number,
    updateMailboxDto: UpdateMailboxDto): Promise<Mailbox>;
  getbyIdActivity(id_mailbox: number): Promise<Mailbox>
  getAllMailbox();
}