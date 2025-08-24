import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { DateService } from "../services/date.service";
import { dateDto } from "../dto/createDate.dto";

@Controller('dates')

export class DateController {

    constructor(private readonly date_service: DateService) { }

    @Post(':idFair')
    create(
        @Param('idFair', ParseIntPipe) idFair: number,
        @Body() createDate: dateDto
    ) {
        return this.date_service.create(idFair, createDate);
    }

    @Get(':id_fair')
    findDatesByFair(@Param('id_fair', ParseIntPipe) id_fair: number) {
        return this.date_service.findByFair(id_fair);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        return this.date_service.remove(id);
    }
}