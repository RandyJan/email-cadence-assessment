import "dotenv/config";
import { Worker } from "@temporalio/worker";
import * as activities from "./activities/email.activity";

async function main() {
  const taskQueue = process.env.TEMPORAL_TASK_QUEUE || "email-cadence";

  const worker = await Worker.create({
    taskQueue,
    workflowsPath: require.resolve("./workflows"),
    activities,
  });

  console.log(`[WORKER] Running on taskQueue="${taskQueue}"`);
  await worker.run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
