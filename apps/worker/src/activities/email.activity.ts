import type { CadenceStep } from "../types";

export async function sendEmailActivity(input: {
  contactEmail: string;
  step: Extract<CadenceStep, { type: "SEND_EMAIL" }>;
}) {
  const timestamp = Date.now();
  const messageId = `mock_${Math.random().toString(36).slice(2)}`;

  console.log(
    `[MOCK_EMAIL] to=${input.contactEmail} subject="${input.step.subject}" body="${input.step.body}"`
  );

  return {
    success: true,
    messageId,
    timestamp,
  };
}
