"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AppBadge,
  AppButton,
  AppCard,
  EmptyState,
  AppInput,
  AppSearchBar,
  AppToolbar,
  LoadingState,
  PageTitle,
} from "@/components/ui";

const platformOptions = ["All Platforms", "Amazon", "Temu", "Tmall", "TikTok", "Shopify"];
const statusOptions = ["All Status", "Draft", "Working", "Completed", "Archived"];

type ProjectStatus = "Draft" | "Working" | "Completed" | "Archived";

type ApiProject = {
  id: string;
  name: string;
  description: string | null;
  platformId: string;
  language: string;
  status: ProjectStatus;
  coverMediaId: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectsResponse = {
  success: boolean;
  data?: ApiProject[];
  error?: string;
};

type ApiPlatform = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

type PlatformsResponse = {
  success: boolean;
  data?: ApiPlatform[];
  error?: string;
};

type CreateProjectResponse = {
  success: boolean;
  data?: ApiProject;
  error?: string;
};

type CreateProjectForm = {
  name: string;
  description: string;
  platformId: string;
  language: string;
  status: ProjectStatus;
};

const statusBadgeVariant: Record<ProjectStatus, "default" | "success" | "warning" | "danger"> = {
  Draft: "default",
  Working: "warning",
  Completed: "success",
  Archived: "danger",
};

const platformNameById: Record<string, string> = {
  "platform-amazon": "Amazon",
  "platform-temu": "Temu",
  "platform-tmall": "Tmall",
  "platform-tiktok": "TikTok",
  "platform-shopify": "Shopify",
  "platform-unknown": "Unknown",
};

const initialCreateForm: CreateProjectForm = {
  name: "",
  description: "",
  platformId: "",
  language: "en",
  status: "Draft",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [platforms, setPlatforms] = useState<ApiPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateProjectForm>(initialCreateForm);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/projects");
      const result = (await response.json()) as ProjectsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to load projects.");
      }

      setProjects(result.data ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load projects.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPlatforms = useCallback(async () => {
    try {
      setPlatformError(null);

      const response = await fetch("/api/platforms");
      const result = (await response.json()) as PlatformsResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to load platforms.");
      }

      setPlatforms(result.data ?? []);
    } catch (requestError) {
      setPlatformError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load platforms.",
      );
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchProjects();
      fetchPlatforms();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [fetchPlatforms, fetchProjects]);

  function getPlatformName(platformId: string) {
    return (
      platforms.find((platform) => platform.id === platformId)?.name ??
      platformNameById[platformId] ??
      "Unknown"
    );
  }

  function openCreateDialog() {
    setCreateForm({
      ...initialCreateForm,
      platformId: platforms[0]?.id ?? "",
    });
    setCreateError(null);
    setIsCreateOpen(true);
  }

  function closeCreateDialog() {
    if (!isSubmitting) {
      setIsCreateOpen(false);
      setCreateError(null);
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = createForm.name.trim();
    const platformId = createForm.platformId.trim();

    if (!name) {
      setCreateError("Project name is required.");
      return;
    }

    if (!platformId) {
      setCreateError("Platform is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setCreateError(null);

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name,
          description: createForm.description.trim(),
          platformId,
          language: createForm.language.trim() || "en",
          status: createForm.status || "Draft",
        }),
      });
      const result = (await response.json()) as CreateProjectResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to create project.");
      }

      setIsCreateOpen(false);
      setCreateForm(initialCreateForm);
      await fetchProjects();
    } catch (requestError) {
      setCreateError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create project.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateCreateForm(field: keyof CreateProjectForm, value: string) {
    setCreateForm((currentForm) => {
      return {
        ...currentForm,
        [field]: value,
      };
    });
  }

  function updateCreateStatus(value: string) {
    const nextStatus = statusOptions.includes(value as ProjectStatus)
      ? (value as ProjectStatus)
      : "Draft";

    updateCreateForm("status", nextStatus);
  }

  const platformSelectOptions =
    platforms.length > 0
      ? platforms
      : Object.entries(platformNameById).map(([id, name]) => {
          return {
            id,
            name,
            code: id.replace("platform-", ""),
            description: null,
          };
        });

  const createStatusOptions = statusOptions.filter(
    (status): status is ProjectStatus => status !== "All Status",
  );

  return (
    <AppShell>
      <main className="min-w-0 flex-1 overflow-auto bg-white p-6 text-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <PageTitle
            title="Projects"
            subtitle="Manage all visual design projects and prepare structured AI image workflows."
          />

          <AppCard className="p-5">
            <AppToolbar
              title="Project Management"
              subtitle="High-fidelity placeholder workspace for project planning."
              actions={
                <>
                  <AppButton onClick={openCreateDialog} size="sm">
                    New Project
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Import
                  </AppButton>
                  <AppButton size="sm" variant="secondary">
                    Export
                  </AppButton>
                </>
              }
            />
            <div className="mt-5 grid grid-cols-[1fr_180px_160px_auto] gap-3">
              <AppSearchBar placeholder="Search projects" />
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {platformOptions.map((platform) => (
                  <option key={platform}>{platform}</option>
                ))}
              </select>
              <select className="h-10 rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100">
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
              <AppButton variant="ghost">Sort Updated</AppButton>
            </div>
          </AppCard>

          {isLoading ? (
            <section className="grid grid-cols-3 gap-5">
              {Array.from({ length: 3 }, (_, index) => (
                <LoadingState key={index} />
              ))}
            </section>
          ) : null}

          {!isLoading && error ? (
            <AppCard className="border-red-100 bg-red-50 p-5">
              <p className="text-sm font-semibold text-red-700">Unable to load projects</p>
              <p className="mt-2 text-sm text-red-600">{error}</p>
            </AppCard>
          ) : null}

          {!isLoading && !error && projects.length === 0 ? (
            <EmptyState
              title="No projects found"
              description="Projects from the database will appear here after seed data is available."
            />
          ) : null}

          {!isLoading && !error && projects.length > 0 ? (
            <section className="grid grid-cols-3 gap-5">
              {projects.map((project) => {
                const platformName = getPlatformName(project.platformId);

                return (
                  <AppCard
                    key={project.id}
                    className="group cursor-pointer overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md hover:shadow-blue-100"
                  >
                    <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-100">
                      <div className="absolute left-4 top-4 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                        {project.coverMediaId ?? project.id}
                      </div>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-white text-lg font-semibold text-blue-600 shadow-sm">
                        {platformName.slice(0, 2).toUpperCase()}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-950">
                            {project.name}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {project.description ?? "No description provided."}
                          </p>
                        </div>
                        <AppBadge>{platformName}</AppBadge>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3 border-y border-blue-50 py-4">
                        <div>
                          <p className="text-xs text-slate-500">Products</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">-</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Images</p>
                          <p className="mt-1 text-sm font-semibold text-slate-950">-</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Language</p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-950">
                            {project.language}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Updated</p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(project.updatedAt)}
                          </p>
                        </div>
                        <AppBadge variant={statusBadgeVariant[project.status]}>
                          {project.status}
                        </AppBadge>
                      </div>
                    </div>
                  </AppCard>
                );
              })}
            </section>
          ) : null}

          <AppCard className="flex items-center justify-between p-4">
            <AppButton variant="secondary">Previous</AppButton>
            <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Page 1 of 2
            </div>
            <AppButton variant="secondary">Next</AppButton>
          </AppCard>

          {isCreateOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-6">
              <AppCard className="w-full max-w-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <PageTitle
                    title="New Project"
                    subtitle="Create a database-backed project record."
                  />
                  <AppButton
                    disabled={isSubmitting}
                    onClick={closeCreateDialog}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Close
                  </AppButton>
                </div>

                <form className="mt-5 space-y-4" onSubmit={handleCreateProject}>
                  <AppInput
                    label="Project Name"
                    onChange={(event) => updateCreateForm("name", event.target.value)}
                    placeholder="Enter project name"
                    required
                    value={createForm.name}
                  />

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Description
                    </span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onChange={(event) =>
                        updateCreateForm("description", event.target.value)
                      }
                      placeholder="Optional project description"
                      value={createForm.description}
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Platform
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) =>
                          updateCreateForm("platformId", event.target.value)
                        }
                        required
                        value={createForm.platformId}
                      >
                        <option value="">Select platform</option>
                        {platformSelectOptions.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <AppInput
                      label="Language"
                      onChange={(event) =>
                        updateCreateForm("language", event.target.value)
                      }
                      value={createForm.language}
                    />

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Status
                      </span>
                      <select
                        className="h-10 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        onChange={(event) => updateCreateStatus(event.target.value)}
                        value={createForm.status}
                      >
                        {createStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {platformError ? (
                    <p className="rounded-lg border border-yellow-100 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                      {platformError}
                    </p>
                  ) : null}

                  {createError ? (
                    <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {createError}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-end gap-3 border-t border-blue-50 pt-4">
                    <AppButton
                      disabled={isSubmitting}
                      onClick={closeCreateDialog}
                      type="button"
                      variant="secondary"
                    >
                      Cancel
                    </AppButton>
                    <AppButton disabled={isSubmitting} type="submit">
                      {isSubmitting ? "Creating..." : "Create Project"}
                    </AppButton>
                  </div>
                </form>
              </AppCard>
            </div>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
