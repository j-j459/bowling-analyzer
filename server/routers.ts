import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { Frame } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { extractBowlingScoresFromImage } from "./ocr-service";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  scores: router({
    // Get all scores for the current user
    list: protectedProcedure.query(({ ctx }) => {
      return db.getUserScores(ctx.user.id);
    }),

    // Get a single score by ID
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        return db.getScoreById(input.id, ctx.user.id);
      }),

    // Create a new score
    create: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().optional(),
          date: z.date(),
          location: z.string().optional(),
          totalScore: z.number().min(0).max(300),
          gameNumber: z.number().min(1).default(1),
          frames: z.array(
            z.object({
              frameNumber: z.number().min(1).max(10),
              firstThrow: z.number().min(0).max(10).nullable(),
              secondThrow: z.number().min(0).max(10).nullable(),
              thirdThrow: z.number().min(0).max(10).nullable().optional(),
              score: z.number().min(0).max(300),
              isStrike: z.boolean(),
              isSpare: z.boolean(),
              remainingPins: z.array(z.number().min(1).max(10)).optional(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const scoreId = await db.createScore({
          userId: ctx.user.id,
          imageUrl: input.imageUrl || null,
          date: input.date,
          location: input.location || null,
          totalScore: input.totalScore,
          gameNumber: input.gameNumber,
          frames: input.frames as Frame[],
        });
        return { id: scoreId };
      }),

    // Update an existing score
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          imageUrl: z.string().optional(),
          date: z.date().optional(),
          location: z.string().optional(),
          totalScore: z.number().min(0).max(300).optional(),
          gameNumber: z.number().min(1).optional(),
          frames: z
            .array(
              z.object({
                frameNumber: z.number().min(1).max(10),
                firstThrow: z.number().min(0).max(10).nullable(),
                secondThrow: z.number().min(0).max(10).nullable(),
                thirdThrow: z.number().min(0).max(10).nullable().optional(),
                score: z.number().min(0).max(300),
                isStrike: z.boolean(),
                isSpare: z.boolean(),
                remainingPins: z.array(z.number().min(1).max(10)).optional(),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateScore(id, ctx.user.id, data as any);
        return { success: true };
      }),

    // Delete a score
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteScore(input.id, ctx.user.id);
        return { success: true };
      }),

    // Get statistics
    statistics: protectedProcedure.query(({ ctx }) => {
      return db.getUserStatistics(ctx.user.id);
    }),

    // Upload score image to S3
    uploadImage: protectedProcedure
      .input(
        z.object({
          base64Data: z.string(),
          fileName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Convert base64 to buffer
        const base64WithoutPrefix = input.base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64WithoutPrefix, "base64");

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileKey = `scores/${ctx.user.id}/${timestamp}-${randomSuffix}.jpg`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, "image/jpeg");

        return { url };
      }),

    // Analyze score image using AI
    analyzeImage: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a bowling score analyzer. Analyze the bowling score sheet image and extract the following information in JSON format:
{
  "totalScore": number (total score for the game),
  "frames": [
    {
      "frameNumber": number (1-10),
      "firstThrow": number | null (pins knocked down on first throw, 0-10),
      "secondThrow": number | null (pins knocked down on second throw, 0-10),
      "thirdThrow": number | null (only for 10th frame),
      "score": number (cumulative score up to this frame),
      "isStrike": boolean,
      "isSpare": boolean
    }
  ]
}

Rules:
- A strike is when all 10 pins are knocked down on the first throw (firstThrow = 10)
- A spare is when all 10 pins are knocked down using both throws (firstThrow + secondThrow = 10)
- The 10th frame can have up to 3 throws if there's a strike or spare
- If you cannot read a specific value clearly, use null
- Ensure the cumulative scores are calculated correctly`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Please analyze this bowling score sheet and extract the frame-by-frame data." },
                { type: "image_url", image_url: { url: input.imageUrl } },
              ],
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        if (typeof content !== "string") {
          throw new Error("Invalid response format from LLM");
        }
        const data = JSON.parse(content);

        return data;
      }),

    // Analyze multiple scores from a single image
    analyzeMultipleScores: protectedProcedure
      .input(
        z.object({
          imageUrl: z.string().url(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await extractBowlingScoresFromImage(input.imageUrl);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
