    export type CadenceStep =
  | {
      id: string;
      type: "SEND_EMAIL";
      subject: string;
      body: string;
    }
  | {
      id: string;
      type: "WAIT";
      seconds: number;
    };

export type CadencePayload = {
  id: string;
  name: string;
  steps: CadenceStep[];
};

export type WorkflowStatus = "RUNNING" | "COMPLETED";

export type WorkflowState = {
  currentStepIndex: number;
  stepsVersion: number;
  status: WorkflowStatus;
};
