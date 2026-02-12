import type { CadencePayload } from "./types";

export type EnrollmentRecord = {
  id: string;
  cadenceId: string;
  contactEmail: string;
  workflowId: string;
  createdAt: number;
};

export const cadences = new Map<string, CadencePayload>();
export const enrollments = new Map<string, EnrollmentRecord>();
