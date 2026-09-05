import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table linking with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'lexi_decisions' table to log evaluations and objections
export const lexiDecisions = pgTable('lexi_decisions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Links to users.uid
  decision: text('decision').notNull(), // ALLOW, BLOCK, REVIEW, FREEZE
  legalBasisLaw: text('legal_basis_law'),
  legalBasisArticle: text('legal_basis_article'),
  legalBasisExplanation: text('legal_basis_explanation'),
  rationale: text('rationale'),
  objectionDraft: text('objection_draft'),
  eventType: text('event_type'),
  employeeName: text('employee_name'),
  employeeId: text('employee_id'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Define relationships for the 'users' table
export const usersRelations = relations(users, ({ many }) => ({
  decisions: many(lexiDecisions),
}));

// Define relationships for the 'lexi_decisions' table
export const lexiDecisionsRelations = relations(lexiDecisions, ({ one }) => ({
  user: one(users, {
    fields: [lexiDecisions.userId],
    references: [users.uid],
  }),
}));
