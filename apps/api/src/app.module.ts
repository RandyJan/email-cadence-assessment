import { Module, OnModuleInit } from "@nestjs/common";
import { CadencesController } from "./cadences/cadences.controller";
import { EnrollmentsController } from "./enrollments/enrollments.controller";
import { TemporalService } from "./temporal/temporal.service";

@Module({
  controllers: [CadencesController, EnrollmentsController],
  providers: [TemporalService],
})
export class AppModule implements OnModuleInit {
  constructor(private temporal: TemporalService) {}

  async onModuleInit() {
    await this.temporal.init();
  }
}
