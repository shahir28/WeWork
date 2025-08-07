import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  isOnline: boolean("is_online").default(false),
  currentRoomId: varchar("current_room_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "focus", "casual", "meeting"
  isPublic: boolean("is_public").default(true),
  createdBy: varchar("created_by").notNull(),
  maxParticipants: integer("max_participants").default(12),
  ambientSound: text("ambient_sound"), // "rain", "forest", "fire", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomParticipants = pgTable("room_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  userId: varchar("user_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  isMuted: boolean("is_muted").default(false),
  isVideoOff: boolean("is_video_off").default(false),
  isSpeaking: boolean("is_speaking").default(false),
});

export const focusSessions = pgTable("focus_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  roomId: varchar("room_id").notNull(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  quality: integer("quality"), // 1-5 rating
  notes: text("notes"),
});

export const meetingNotes = pgTable("meeting_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  summary: text("summary"),
  actionItems: json("action_items").$type<string[]>().default([]),
  keyDecisions: json("key_decisions").$type<string[]>().default([]),
  participants: json("participants").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  generatedBy: text("generated_by").default("ai"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertFocusSessionSchema = createInsertSchema(focusSessions).omit({
  id: true,
  startTime: true,
});

export const insertMeetingNotesSchema = createInsertSchema(meetingNotes).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertMeetingNotes = z.infer<typeof insertMeetingNotesSchema>;
export type MeetingNotes = typeof meetingNotes.$inferSelect;
