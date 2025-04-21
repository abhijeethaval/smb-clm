import { pgTable, text, serial, integer, boolean, date, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["Author", "Approver"] }).notNull(),
  fullName: text("full_name").notNull(),
  initials: text("initials").notNull(),
});

export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parties: text("parties").notNull(),
  effectiveDate: date("effective_date"),
  expiryDate: date("expiry_date"),
  contractValue: integer("contract_value"),
  status: text("status", { 
    enum: ["Draft", "Pending Approval", "Approved", "Rejected", "Executed", "Expired"] 
  }).notNull().default("Draft"),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull(), // References users.id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  templateId: integer("template_id"), // References contractTemplates.id
});

export const contractVersions = pgTable("contract_versions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(), // References contracts.id
  content: text("content").notNull(),
  changedBy: integer("changed_by").notNull(), // References users.id
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changeDescription: text("change_description"),
});

export const contractApprovals = pgTable("contract_approvals", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull(), // References contracts.id
  approverId: integer("approver_id").notNull(), // References users.id
  status: text("status", { enum: ["Pending", "Approved", "Rejected"] }).notNull().default("Pending"),
  feedback: text("feedback"),
  actionDate: timestamp("action_date"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id"), // References contracts.id, optional as some activities might not be contract-specific
  userId: integer("user_id").notNull(), // References users.id
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert Schemas and Types
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertContractTemplateSchema = createInsertSchema(contractTemplates).omit({ id: true });
export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertContractVersionSchema = createInsertSchema(contractVersions).omit({ id: true, changedAt: true });
export const insertContractApprovalSchema = createInsertSchema(contractApprovals).omit({ id: true, requestedAt: true, actionDate: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, timestamp: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type InsertContractVersion = z.infer<typeof insertContractVersionSchema>;
export type InsertContractApproval = z.infer<typeof insertContractApprovalSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type User = typeof users.$inferSelect;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type ContractVersion = typeof contractVersions.$inferSelect;
export type ContractApproval = typeof contractApprovals.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Login type (for authentication)
export const loginSchema = insertUserSchema.pick({ username: true, password: true });
export type LoginData = z.infer<typeof loginSchema>;

// Extended contract schema with user data
export type ContractWithMeta = Contract & {
  createdByUser?: Pick<User, 'username' | 'fullName'>;
};

// Contract with approval information
export type ContractWithApproval = ContractWithMeta & {
  approvals?: Array<ContractApproval & { approver: Pick<User, 'username' | 'fullName'> }>;
};
