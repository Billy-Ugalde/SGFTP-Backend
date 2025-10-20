import { Controller } from "@nestjs/common";
import { MailboxService } from "../services/mailbox.service";


@Controller('maibox')
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}


}