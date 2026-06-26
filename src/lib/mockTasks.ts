export type TaskStatus = "Waiting" | "Running" | "Completed" | "Failed" | "Canceled";

export interface Task {
  id: string;
  projectId: string;
  productId: string;
  workflowId: string;
  promptId: string;
  taskType: string;
  model: string;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  startedAt: string;
  finishedAt: string;
  duration: string;
  errorMessage: string;
  resultCount: number;
}

const taskTypes = [
  "Generate Image",
  "Compare Outputs",
  "Prepare Export",
  "Prompt Review",
  "Media Validation",
];
const models = ["OpenAI Image", "Gemini Vision", "Flux Pro", "Local Draft"];
const statuses: TaskStatus[] = ["Waiting", "Running", "Completed", "Failed", "Canceled"];

function getProgress(status: TaskStatus, index: number) {
  if (status === "Waiting") return 0;
  if (status === "Running") return 20 + (index % 7) * 10;
  if (status === "Completed") return 100;
  if (status === "Failed") return 64;
  return 28;
}

export const mockTasks: Task[] = Array.from({ length: 100 }, (_, index) => {
  const taskNumber = index + 1;
  const status = statuses[index % statuses.length];
  const createdDay = 26 - (index % 21);

  return {
    id: `task-${String(taskNumber).padStart(4, "0")}`,
    projectId: `project-${String((index % 20) + 1).padStart(3, "0")}`,
    productId: `product-${String((index % 50) + 1).padStart(3, "0")}`,
    workflowId: `workflow-${String((index % 12) + 1).padStart(3, "0")}`,
    promptId: `prompt-${String((index % 50) + 1).padStart(3, "0")}`,
    taskType: taskTypes[index % taskTypes.length],
    model: models[index % models.length],
    status,
    progress: getProgress(status, index),
    createdAt: `2026-06-${String(createdDay).padStart(2, "0")} 09:${String(
      index % 60,
    ).padStart(2, "0")}`,
    startedAt:
      status === "Waiting"
        ? "-"
        : `2026-06-${String(createdDay).padStart(2, "0")} 09:${String(
            (index + 7) % 60,
          ).padStart(2, "0")}`,
    finishedAt:
      status === "Completed" || status === "Failed" || status === "Canceled"
        ? `2026-06-${String(createdDay).padStart(2, "0")} 09:${String(
            (index + 19) % 60,
          ).padStart(2, "0")}`
        : "-",
    duration: status === "Waiting" ? "-" : `${2 + (index % 18)}m ${index % 50}s`,
    errorMessage: status === "Failed" ? "Placeholder task failure message." : "",
    resultCount: status === "Completed" ? 1 + (index % 6) : 0,
  };
});
