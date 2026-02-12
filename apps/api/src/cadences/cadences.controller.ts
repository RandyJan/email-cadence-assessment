import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { cadences } from "../store";
import type { CadencePayload } from "../types";

@Controller("cadences")
export class CadencesController {
  @Post()
  create(@Body() body: CadencePayload) {
    cadences.set(body.id, body);
    return body;
  }

  @Get(":id")
  get(@Param("id") id: string) {
    const cadence = cadences.get(id);
    if (!cadence) return { error: "Cadence not found" };
    return cadence;
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: CadencePayload) {
    if (id !== body.id) return { error: "Path id must match body.id" };
    cadences.set(id, body);
    return body;
  }
}
