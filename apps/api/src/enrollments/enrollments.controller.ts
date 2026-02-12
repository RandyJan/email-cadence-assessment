import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { cadences, enrollments } from "../store";
import type { CadenceStep } from "../types";
import { TemporalService } from "../temporal/temporal.service";

@Controller("enrollments")
export class EnrollmentsController {
  constructor(private temporal: TemporalService) {}

  @Post()
  async enroll(@Body() body: { cadenceId: string; contactEmail: string }) {
    const cadence = cadences.get(body.cadenceId);
    if (!cadence) return { error: "Cadence not found" };

    const enrollmentId = uuidv4();
    const workflowId = await this.temporal.startEnrollmentWorkflow({
      enrollmentId,
      contactEmail: body.contactEmail,
      steps: cadence.steps,
    });

    enrollments.set(enrollmentId, {
      id: enrollmentId,
      cadenceId: cadence.id,
      contactEmail: body.contactEmail,
      workflowId,
      createdAt: Date.now(),
    });

    return { id: enrollmentId };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    const enrollment = enrollments.get(id);
    if (!enrollment) return { error: "Enrollment not found" };

    const state = await this.temporal.queryState(enrollment.workflowId);

    return {
      id: enrollment.id,
      currentStepIndex: state.currentStepIndex,
      status: state.status,
      stepsVersion: state.stepsVersion,
    };
  }

  @Post(":id/update-cadence")
  async updateCadence(@Param("id") id: string, @Body() body: { steps: CadenceStep[] }) {
    const enrollment = enrollments.get(id);
    if (!enrollment) return { error: "Enrollment not found" };

    await this.temporal.signalUpdateCadence(enrollment.workflowId, body.steps);

    const state = await this.temporal.queryState(enrollment.workflowId);
    return {
      ok: true,
      currentStepIndex: state.currentStepIndex,
      status: state.status,
      stepsVersion: state.stepsVersion,
    };
  }
}
