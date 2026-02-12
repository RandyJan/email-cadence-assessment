import * as wf from "@temporalio/workflow";
import type { CadenceStep, WorkflowState } from "../types";

type Activities = {
  sendEmailActivity: (input: {
    contactEmail: string;
    step: Extract<CadenceStep, { type: "SEND_EMAIL" }>;
  }) => Promise<{ success: true; messageId: string; timestamp: number }>;
};

const activities = wf.proxyActivities<Activities>({
  startToCloseTimeout: "30s",
});

export const getStateQuery = wf.defineQuery<WorkflowState>("getState");
export const updateCadenceSignal = wf.defineSignal<[CadenceStep[]]>("updateCadence");

export async function cadenceWorkflow(args: {
  contactEmail: string;
  steps: CadenceStep[];
}) {
  let steps: CadenceStep[] = args.steps;

  let state: WorkflowState = {
    currentStepIndex: 0,
    stepsVersion: 1,
    status: "RUNNING",
  };

  wf.setHandler(getStateQuery, () => state);

  wf.setHandler(updateCadenceSignal, (newSteps) => {
    // Update rules (required):
    // - Already completed steps remain completed.
    // - Keep currentStepIndex.
    // - If new steps length <= currentStepIndex, mark workflow COMPLETED.
    // - Else continue from currentStepIndex using the new steps.
    // - Increment stepsVersion.
    steps = newSteps;
    state = { ...state, stepsVersion: state.stepsVersion + 1 };

    if (steps.length <= state.currentStepIndex) {
      state = { ...state, status: "COMPLETED" };
    }
  });

  while (state.status === "RUNNING") {
    if (state.currentStepIndex >= steps.length) {
      state = { ...state, status: "COMPLETED" };
      break;
    }

    const step = steps[state.currentStepIndex];

    if (step.type === "WAIT") {
      const seconds = Math.max(0, step.seconds ?? 0);
      await wf.sleep(seconds * 1000);
    } else if (step.type === "SEND_EMAIL") {
      await activities.sendEmailActivity({
        contactEmail: args.contactEmail,
        step,
      });
    }

    // complete this step
    state = { ...state, currentStepIndex: state.currentStepIndex + 1 };

    // edge case: cadence updated and now too short
    if (steps.length <= state.currentStepIndex) {
      state = { ...state, status: "COMPLETED" };
      break;
    }
  }
}
