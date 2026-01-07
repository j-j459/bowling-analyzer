import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, scores, InsertScore } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all scores for a specific user
 */
export async function getUserScores(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(scores)
    .where(eq(scores.userId, userId))
    .orderBy(desc(scores.date));
}

/**
 * Get scores within a date range
 */
export async function getUserScoresInRange(
  userId: number,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(scores)
    .where(
      and(
        eq(scores.userId, userId),
        gte(scores.date, startDate),
        lte(scores.date, endDate)
      )
    )
    .orderBy(desc(scores.date));
}

/**
 * Get a single score by ID
 */
export async function getScoreById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(scores)
    .where(and(eq(scores.id, id), eq(scores.userId, userId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Create a new score
 */
export async function createScore(data: InsertScore) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(scores).values(data);
  return Number(result[0].insertId);
}

/**
 * Update an existing score
 */
export async function updateScore(
  id: number,
  userId: number,
  data: Partial<InsertScore>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(scores)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(scores.id, id), eq(scores.userId, userId)));
}

/**
 * Delete a score
 */
export async function deleteScore(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scores).where(and(eq(scores.id, id), eq(scores.userId, userId)));
}

/**
 * Get statistics for a user
 */
export async function getUserStatistics(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userScores = await getUserScores(userId);

  if (userScores.length === 0) {
    return {
      totalGames: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalStrikes: 0,
      totalSpares: 0,
      strikeRate: 0,
      spareRate: 0,
    };
  }

  const totalGames = userScores.length;
  const totalScore = userScores.reduce((sum, score) => sum + score.totalScore, 0);
  const averageScore = Math.round(totalScore / totalGames);
  const highestScore = Math.max(...userScores.map((s) => s.totalScore));
  const lowestScore = Math.min(...userScores.map((s) => s.totalScore));

  // Calculate strikes and spares
  let totalStrikes = 0;
  let totalSpares = 0;
  let totalFrames = 0;

  userScores.forEach((score) => {
    score.frames.forEach((frame) => {
      totalFrames++;
      if (frame.isStrike) totalStrikes++;
      if (frame.isSpare) totalSpares++;
    });
  });

  const strikeRate = totalFrames > 0 ? (totalStrikes / totalFrames) * 100 : 0;
  const spareRate = totalFrames > 0 ? (totalSpares / totalFrames) * 100 : 0;

  return {
    totalGames,
    averageScore,
    highestScore,
    lowestScore,
    totalStrikes,
    totalSpares,
    strikeRate: Math.round(strikeRate * 10) / 10,
    spareRate: Math.round(spareRate * 10) / 10,
  };
}
