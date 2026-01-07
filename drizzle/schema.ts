import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Scores table - stores bowling game scores
export const scores = mysqlTable("scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageUrl: text("imageUrl"), // S3 URL of the score image
  date: timestamp("date").notNull(), // Date of the game
  location: varchar("location", { length: 255 }), // Bowling alley name
  totalScore: int("totalScore").notNull(), // Total score for the game
  gameNumber: int("gameNumber").default(1).notNull(), // Game number in the session
  frames: json("frames").$type<Frame[]>().notNull(), // Array of frame data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Pin positions in bowling (standard 1-10 numbering)
// 7 8 9 10
//  4 5 6
//   2 3
//    1
export interface PinData {
  pinNumber: number; // 1-10
  knocked: boolean; // Whether this pin was knocked down
  order?: number; // Order in which pin was knocked down
}

// Frame data structure (stored as JSON in scores.frames)
export interface Frame {
  frameNumber: number; // 1-10
  firstThrow: number | null; // Pins knocked down on first throw (0-10)
  secondThrow: number | null; // Pins knocked down on second throw (0-10)
  thirdThrow?: number | null; // Only for 10th frame
  score: number; // Cumulative score up to this frame
  isStrike: boolean;
  isSpare: boolean;
  remainingPins?: number[]; // Array of remaining pin positions after first throw (1-10)
  firstThrowPins?: PinData[]; // Detailed pin data for first throw
  secondThrowPins?: PinData[]; // Detailed pin data for second throw
}

// Export types for TypeScript
export type Score = typeof scores.$inferSelect;
export type InsertScore = typeof scores.$inferInsert;
