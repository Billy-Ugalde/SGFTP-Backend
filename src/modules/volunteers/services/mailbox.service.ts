import { Injectable } from "@nestjs/common";
import { Mailbox } from "../entities/mailbox.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { IMailboxService } from "../interfaces/mailbox.interface";
import { CreateMailboxDto } from "../dto/createMailbox.dto";
import { UpdateMailboxDto } from "../dto/updateMailbox.dto";

@Injectable()
export class MailboxService implements IMailboxService {
  constructor(
    @InjectRepository(Mailbox)
    private mailboxRepository: Repository<Mailbox>,
    private dataSource: DataSource,
  ) { }
    createActivity(createMailboxDto: CreateMailboxDto): Promise<Mailbox> {
        throw new Error("Method not implemented.");
    }
    updateActivity(id_mailbox: number, updateMailboxDto: UpdateMailboxDto): Promise<Mailbox> {
        throw new Error("Method not implemented.");
    }
    getbyIdActivity(id_mailbox: number): Promise<Mailbox> {
        throw new Error("Method not implemented.");
    }
    getAllMailbox() {
        throw new Error("Method not implemented.");
    }
}