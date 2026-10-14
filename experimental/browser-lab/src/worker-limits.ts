/** Two workflow-task pollers are required by Temporal's cached workflow worker.
 *  Browser sessions are activities, independently capped to exactly one.
 */
export const singleSessionWorkerLimits = Object.freeze({
 maxConcurrentActivityTaskExecutions:1,
 maxConcurrentWorkflowTaskExecutions:2,
});
