import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { StandService } from "../services/stand.service";
import { Stand } from "../entities/stand.entity";

@Controller('stand')
export class StandController {
    constructor(private readonly standService: StandService) { }

    @Get()
    async getAllStands(): Promise<Stand[]> {
        return this.standService.getAllStandsOrdered();
    }

    @Get(':id_stand')
    async getStandsByFair(
        @Param('id_stand', ParseIntPipe) id_fair: number
    ): Promise<Stand[]> {
        return this.standService.getStandsByFair(id_fair);
    }
}