import tasksData from './tasks.json'

export const tasks = tasksData.map((task) => ({
  ...task,
  createdAt: new Date(task.createdAt),
  updatedAt: new Date(task.updatedAt),
  dueDate: new Date(task.dueDate),
}))
