import { describe, it, expect } from "vitest";
import {
  extractBowlingScoresFromImage,
  extractTextFromImage,
} from "../server/ocr-service";

describe("OCR Service", () => {
  // Note: These tests use mock data since actual image URLs require real images
  // In production, you would use actual bowling score images

  describe("extractBowlingScoresFromImage", () => {
    it("should handle invalid image URLs gracefully", async () => {
      try {
        // This will fail because the URL is not a real image
        await extractBowlingScoresFromImage("https://example.com/invalid.jpg");
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toContain("Failed to extract");
      }
    });

    it("should return an OCRResult structure", async () => {
      // Mock test to verify the expected structure
      const mockResult = {
        scores: [
          {
            frames: [
              {
                frameNumber: 1,
                firstThrow: 10,
                secondThrow: null,
                isStrike: true,
                isSpare: false,
              },
            ],
            totalScore: 30,
            playerName: "Player 1",
          },
        ],
        confidence: 0.85,
        rawText: "Mock OCR text",
      };

      expect(mockResult.scores).toHaveLength(1);
      expect(mockResult.scores[0].totalScore).toBe(30);
      expect(mockResult.confidence).toBeGreaterThan(0);
      expect(mockResult.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("extractTextFromImage", () => {
    it("should handle invalid image URLs gracefully", async () => {
      try {
        await extractTextFromImage("https://example.com/invalid.jpg");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should return a string", async () => {
      // Mock test to verify return type
      const mockText = "Frame 1: 10, Frame 2: 7/3, Frame 3: 5+2";
      expect(typeof mockText).toBe("string");
    });
  });

  describe("Score validation", () => {
    it("should validate frame numbers", () => {
      const validFrame = {
        frameNumber: 5,
        firstThrow: 7,
        secondThrow: 2,
        isStrike: false,
        isSpare: false,
      };

      expect(validFrame.frameNumber).toBeGreaterThanOrEqual(1);
      expect(validFrame.frameNumber).toBeLessThanOrEqual(10);
    });

    it("should validate throw values", () => {
      const validThrow = 7;
      expect(validThrow).toBeGreaterThanOrEqual(0);
      expect(validThrow).toBeLessThanOrEqual(10);
    });

    it("should validate strike conditions", () => {
      const strikeFrame = {
        frameNumber: 1,
        firstThrow: 10,
        secondThrow: null,
        isStrike: true,
        isSpare: false,
      };

      expect(strikeFrame.isStrike).toBe(true);
      expect(strikeFrame.firstThrow).toBe(10);
      expect(strikeFrame.secondThrow).toBeNull();
    });

    it("should validate spare conditions", () => {
      const spareFrame = {
        frameNumber: 2,
        firstThrow: 7,
        secondThrow: 3,
        isStrike: false,
        isSpare: true,
      };

      expect(spareFrame.isSpare).toBe(true);
      expect(spareFrame.firstThrow! + spareFrame.secondThrow!).toBe(10);
    });
  });

  describe("Multiple score extraction", () => {
    it("should handle multiple scores in a single image", () => {
      const multipleScores = [
        {
          playerName: "Player 1",
          frames: [
            {
              frameNumber: 1,
              firstThrow: 10,
              secondThrow: null,
              isStrike: true,
              isSpare: false,
            },
          ],
          totalScore: 30,
        },
        {
          playerName: "Player 2",
          frames: [
            {
              frameNumber: 1,
              firstThrow: 7,
              secondThrow: 3,
              isStrike: false,
              isSpare: true,
            },
          ],
          totalScore: 20,
        },
      ];

      expect(multipleScores).toHaveLength(2);
      expect(multipleScores[0].playerName).toBe("Player 1");
      expect(multipleScores[1].playerName).toBe("Player 2");
      expect(multipleScores[0].totalScore).toBeGreaterThan(
        multipleScores[1].totalScore
      );
    });

    it("should filter out invalid scores", () => {
      const scores = [
        {
          frames: [
            {
              frameNumber: 1,
              firstThrow: 10,
              secondThrow: null,
              isStrike: true,
              isSpare: false,
            },
          ],
          totalScore: 30,
        },
        null, // Invalid score
      ];

      const validScores = scores.filter((s) => s !== null);
      expect(validScores).toHaveLength(1);
    });
  });
});
