"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  EmptyState,
  AppSearchBar,
  AppTable,
  AppToolbar,
  LoadingState,
  PageTitle,
} from "@/components/ui";

type TaskStatus = "Waiting" | "Running" | "Completed" | "Failed" | "Canceled";

type ApiTask = {
  id: string;
  projectId: string;
  productId: string;
  workflowId: string;
  promptTemplateId: string;
  taskType: string;
  model: string;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null;
  errorMessage: string | null;
  resultCount: number;
};

type TasksResponse = {
  success: boolean;
  data?: ApiTask[];
  error?: string;
};

const statusOptions: Array<"All Status" | TaskStatus> = [
  "All Status",
  "Waiting",
  "Running",
  "Completed",
  "Failed",
  "Canceled",
];
const modelOptions = ["All Models", "OpenAI Image", "Gemini Vision", "Flux Pro", "Local Draft"];

const statusBadgeVariant: Record<TaskStatus, "default" | "success" | "warning" | "danger"> = {
  Waiting: "default",
  Running: "warning",
  Completed: "success",
  Failed: "danger",
  Canceled: "default",
};

const tableColumns = [
  { key: "id", title: "Task ID" },
  { key: "projectId", title: "Project" },
  { key: "productId", title: "Product" },
  { key: "workflowId", title: "Workflow" },
  { key: "model", title: "Model" },
  { key: "progress", title: "Progress" },
  { key: "status", title: "Status" },
  { key: "duration", title: "Duration" },
  { key: "createdAt", title: "Created Time" },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(seconds: number | null) {
  if (seconds === null) {
    return "-";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTasks() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/tasks");
        const result = (await response.json()) as TasksResponse;

        if (!response.ok || !result.success) {
          throw new Error(result.error ?? "Failed to load tasks.");
        }

        if (isMounted) {
          setTasks(result.data ?? []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError instanceof Error ? requestError.message : "Failed to load tasks.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedTask = tasks[3] ?? tasks[0];
  const tableRows = tasks.map((task) => ({
    id: task.id,
    projectId: task.projectId,
    productId: task.productId,
    workflowId: task.workflowId,
    model: task.model,
    progress: `${task.progress}%`,
    status: task.status,
    duration: formatDuration(task.duration),
    createdAt: formatDateTime(task.createdAt),
  }));

  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="Task Center"
            subtitle="Monitor placeholder task queues across projects, workflows, prompts, and models."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Task Queue"
              subtitle="High-fidelity UI preview for unified task management."
              actions={
                <>
                  <AppButton size="sm">New Task</AppButton>
                  <AppButton size="sm" variant="secondary">
                    Refresh
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Retry
                  </AppButton>
                  <AppButton size="sm" variant="ghost">
                    Cancel
                  </AppButton>
                  <AppButton size="sm" variant="ghost">
                    Delete
                  </AppButton>
                </>
              }
            />
            <div className="mt-5 grid grid-cols-[1fr_170px_170px] gap-3">
              <AppSearchBar placeholder="Search tasks" />
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {modelOptions.map((model) => (
                  <option key={model}>{model}</option>
                ))}
              </select>
            </div>
          </AppCard>

          <section className="grid grid-cols-[1fr_360px] gap-5">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <AppCard className="p-5">
                  <div className="grid grid-cols-2 gap-4">
                    <LoadingState />
                    <LoadingState />
                    <LoadingState />
                    <LoadingState />
                  </div>
                </AppCard>
              ) : null}

              {!isLoading && error ? (
                <AppCard className="border-red-100 bg-red-50 p-5">
                  <p className="text-sm font-semibold text-red-700">
                    Unable to load tasks
                  </p>
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                </AppCard>
              ) : null}

              {!isLoading && !error && tasks.length === 0 ? (
                <EmptyState
                  title="No tasks found"
                  description="Task records from the database will appear here after seed data is available."
                />
              ) : null}

              {!isLoading && !error && tasks.length > 0 ? (
                <AppCard className="overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <AppTable columns={tableColumns} rows={tableRows} />
                  </div>
                </AppCard>
              ) : null}

              <AppCard className="flex items-center justify-between p-4">
                <AppButton variant="secondary">Previous</AppButton>
                <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Page 1 of 6
                </div>
                <AppButton variant="secondary">Next</AppButton>
              </AppCard>
            </div>

            {selectedTask ? (
              <AppCard className="sticky top-0 h-fit overflow-hidden">
                <div className="border-b border-blue-100 p-5">
                  <AppToolbar
                    title="Task Detail"
                    subtitle={selectedTask.id}
                    actions={
                      <AppBadge variant={statusBadgeVariant[selectedTask.status]}>
                        {selectedTask.status}
                      </AppBadge>
                    }
                  />
                </div>
                <div className="space-y-5 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <AppCard className="p-4" withShadow={false}>
                      <p className="text-xs text-slate-500">Prompt</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedTask.promptTemplateId}
                      </p>
                    </AppCard>
                    <AppCard className="p-4" withShadow={false}>
                      <p className="text-xs text-slate-500">Outputs</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {selectedTask.resultCount}
                      </p>
                    </AppCard>
                  </div>

                  <AppCard className="bg-slate-50 p-4" withShadow={false}>
                    <p className="text-xs font-semibold uppercase text-blue-600">
                      Parameters
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Task Type: {selectedTask.taskType}</p>
                      <p>Model: {selectedTask.model}</p>
                      <p>Workflow: {selectedTask.workflowId}</p>
                      <p>Progress: {selectedTask.progress}%</p>
                    </div>
                  </AppCard>

                  <AppCard className="bg-slate-50 p-4" withShadow={false}>
                    <p className="text-xs font-semibold uppercase text-blue-600">Log</p>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      <p>Created task record at {formatDateTime(selectedTask.createdAt)}.</p>
                      <p>Queued task in UI-only mode.</p>
                      <p>No execution engine is connected.</p>
                    </div>
                  </AppCard>

                  <AppCard className="p-4" withShadow={false}>
                    <p className="text-xs font-semibold uppercase text-blue-600">
                      Error Message
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {selectedTask.errorMessage ||
                        "No error message for this placeholder task."}
                    </p>
                  </AppCard>
                </div>
              </AppCard>
            ) : (
              <LoadingState />
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
