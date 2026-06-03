import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table (existing, from Clerk)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Projects
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk User ID
  name: text('name').notNull(),
  description: text('description'),
  status: text('status', { enum: ['active', 'on_hold', 'completed', 'dropped'] }).default('active').notNull(),
  type: text('type', { enum: ['sequential', 'parallel', 'single'] }).default('parallel').notNull(),
  folderId: uuid('folder_id'), // Self-referencing or separate folders table later
  reviewIntervalDays: integer('review_interval_days').default(7),
  lastReviewedAt: timestamp('last_reviewed_at'),
  nextReviewAt: timestamp('next_review_at'),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk User ID
  title: text('title').notNull(),
  note: text('note'),
  status: text('status', { enum: ['inbox', 'active', 'completed', 'dropped'] }).default('inbox').notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
  parentTaskId: uuid('parent_task_id'), // For subtasks
  flagged: boolean('flagged').default(false).notNull(),
  
  // Advanced Status
  blocked: boolean('blocked').default(false).notNull(),
  blockedReason: text('blocked_reason'),
  
  // The 3 Date System
  deferDate: timestamp('defer_date'),
  plannedDate: timestamp('planned_date'),
  dueDate: timestamp('due_date'),
  
  reminderAt: timestamp('reminder_at'),
  repeatRule: text('repeat_rule'), // RRULE string
  
  // Audit timestamps
  completedAt: timestamp('completed_at'),
  droppedAt: timestamp('dropped_at'),
  deletedAt: timestamp('deleted_at'), // Soft delete
  archived: boolean('archived').default(false).notNull(),
  
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['normal', 'exclusive'] }).default('normal').notNull(),
  groupName: text('group_name'), // e.g., 'Energy', 'Priority'
  color: text('color'),
  order: integer('order').default(0),
})

// Task Tags Junction Table (Many-to-Many)
export const taskTags = pgTable('task_tags', {
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
})

// Perspectives (Smart Views)
export const perspectives = pgTable('perspectives', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  rules: jsonb('rules').notNull(), // Storing filter logic as JSON
  groupBy: text('group_by'),
  sortBy: text('sort_by'),
  showCompleted: boolean('show_completed').default(false).notNull(),
  showDropped: boolean('show_dropped').default(false).notNull(),
  order: integer('order').default(0),
})

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
  }),
  subTasks: many(tasks),
  tags: many(taskTags),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  tasks: many(taskTags),
}))

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}))
