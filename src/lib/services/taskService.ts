import { taskRepository } from "@/lib/repositories/taskRepository";

export const taskService = {
  getAll() {
    return taskRepository.findAll();
  },

  getById(id: string) {
    return taskRepository.findById(id);
  },

  getByStatus(status: string) {
    return taskRepository.findByStatus(status);
  },

  getRunning() {
    return taskRepository.findRunning();
  },
};
