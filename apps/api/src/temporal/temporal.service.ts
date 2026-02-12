import "dotenv/config";
import { Injectable } from "@nestjs/common";
import { Client, Connection } from "@temporalio/client";
import type { CadenceStep, WorkflowState } from "../types";

@Injectable()
export class TemporalService {
  private client!: Client;

  async init() {
    const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
    const namespace = process.env.TEMPORAL_NAMESPACE || "default";
    const connection = await Connection.connect({ address });
    this.client = new Client({ connection, namespace });
  }

  async startEnrollmentWorkflow(input: {
    enrollmentId: string;
    contactEmail: string;
    steps: CadenceStep[];
  }) {
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE || "email-cadence";
    const workflowId = `enrollment:${input.enrollmentId}`;

    await this.client.workflow.start("cadenceWorkflow", {
      taskQueue,
      workflowId,
      args: [{ contactEmail: input.contactEmail, steps: input.steps }],
    });

    return workflowId;
  }

  async queryState(workflowId: string): Promise<WorkflowState> {
    const handle = this.client.workflow.getHandle(workflowId);
    return await handle.query<WorkflowState>("getState");
  }

  async signalUpdateCadence(workflowId: string, steps: CadenceStep[]) {
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal("updateCadence", steps);
  }
}
