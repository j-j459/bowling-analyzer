import { describe, it, expect } from "vitest";
import {
  calculatePinSuccessRates,
  analyzeAreas,
  getAnalysisRecommendations,
  calculateStrikeSpareStats,
} from "../lib/bowling-analysis";
import { Frame } from "../drizzle/schema";

describe("Bowling Analysis", () => {
  // Sample frame data for testing
  const sampleFrames: Frame[] = [
    {
      frameNumber: 1,
      firstThrow: 10,
      secondThrow: null,
      score: 30,
      isStrike: true,
      isSpare: false,
      firstThrowPins: [
        { pinNumber: 1, knocked: true },
        { pinNumber: 2, knocked: true },
        { pinNumber: 3, knocked: true },
        { pinNumber: 4, knocked: true },
        { pinNumber: 5, knocked: true },
        { pinNumber: 6, knocked: true },
        { pinNumber: 7, knocked: true },
        { pinNumber: 8, knocked: true },
        { pinNumber: 9, knocked: true },
        { pinNumber: 10, knocked: true },
      ],
    },
    {
      frameNumber: 2,
      firstThrow: 7,
      secondThrow: 3,
      score: 60,
      isStrike: false,
      isSpare: true,
      firstThrowPins: [
        { pinNumber: 1, knocked: true },
        { pinNumber: 2, knocked: true },
        { pinNumber: 3, knocked: false },
        { pinNumber: 4, knocked: true },
        { pinNumber: 5, knocked: true },
        { pinNumber: 6, knocked: false },
        { pinNumber: 7, knocked: true },
        { pinNumber: 8, knocked: false },
        { pinNumber: 9, knocked: false },
        { pinNumber: 10, knocked: false },
      ],
      secondThrowPins: [
        { pinNumber: 3, knocked: true },
        { pinNumber: 6, knocked: true },
        { pinNumber: 8, knocked: true },
        { pinNumber: 9, knocked: true },
        { pinNumber: 10, knocked: true },
      ],
    },
    {
      frameNumber: 3,
      firstThrow: 5,
      secondThrow: 2,
      score: 67,
      isStrike: false,
      isSpare: false,
      firstThrowPins: [
        { pinNumber: 1, knocked: true },
        { pinNumber: 2, knocked: true },
        { pinNumber: 3, knocked: true },
        { pinNumber: 4, knocked: false },
        { pinNumber: 5, knocked: true },
        { pinNumber: 6, knocked: false },
        { pinNumber: 7, knocked: false },
        { pinNumber: 8, knocked: false },
        { pinNumber: 9, knocked: false },
        { pinNumber: 10, knocked: false },
      ],
      secondThrowPins: [
        { pinNumber: 4, knocked: true },
        { pinNumber: 6, knocked: true },
      ],
    },
  ];

  describe("calculatePinSuccessRates", () => {
    it("should calculate success rates for each pin", () => {
      const rates = calculatePinSuccessRates(sampleFrames);

      expect(rates).toHaveLength(10);
      expect(rates[0].pinNumber).toBe(1);

      // Pin 1 should have 100% success rate (knocked in all 3 frames)
      const pin1 = rates.find((r) => r.pinNumber === 1);
      expect(pin1?.successRate).toBe(1);
      expect(pin1?.totalAttempts).toBe(3);

      // Pin 3 should have 75% success rate (knocked in frames 2 and 3, but not attempted in frame 1)
      const pin3 = rates.find((r) => r.pinNumber === 3);
      expect(pin3?.successRate).toBe(0.75); // 3 successes out of 4 attempts
    });

    it("should handle pins that are never knocked", () => {
      const rates = calculatePinSuccessRates(sampleFrames);

      // Pin 7 has low success rate
      const pin7 = rates.find((r) => r.pinNumber === 7);
      expect(pin7?.successRate).toBeLessThan(1);
    });
  });

  describe("analyzeAreas", () => {
    it("should analyze bowling areas correctly", () => {
      const rates = calculatePinSuccessRates(sampleFrames);
      const areas = analyzeAreas(rates);

      expect(areas.length).toBeGreaterThan(0);
      expect(areas.some((a) => a.area === "左エリア")).toBe(true);
      expect(areas.some((a) => a.area === "中央エリア")).toBe(true);
      expect(areas.some((a) => a.area === "右エリア")).toBe(true);
    });

    it("should classify areas as 得意, 普通, or 苦手", () => {
      const rates = calculatePinSuccessRates(sampleFrames);
      const areas = analyzeAreas(rates);

      areas.forEach((area) => {
        expect(["得意", "普通", "苦手"]).toContain(area.assessment);
      });
    });
  });

  describe("getAnalysisRecommendations", () => {
    it("should generate recommendations based on areas", () => {
      const rates = calculatePinSuccessRates(sampleFrames);
      const areas = analyzeAreas(rates);
      const recommendations = getAnalysisRecommendations(areas);

      expect(recommendations.strengths).toBeDefined();
      expect(recommendations.weaknesses).toBeDefined();
      expect(Array.isArray(recommendations.strengths)).toBe(true);
      expect(Array.isArray(recommendations.weaknesses)).toBe(true);
    });
  });

  describe("calculateStrikeSpareStats", () => {
    it("should calculate strike and spare statistics", () => {
      const stats = calculateStrikeSpareStats(sampleFrames);

      expect(stats.strikeCount).toBe(1);
      expect(stats.spareCount).toBe(1);
      expect(stats.totalFrames).toBe(3);
      expect(stats.strikeRate).toBe(1 / 3);
      expect(stats.spareRate).toBe(1 / 3);
    });

    it("should handle empty frames array", () => {
      const stats = calculateStrikeSpareStats([]);

      expect(stats.strikeCount).toBe(0);
      expect(stats.spareCount).toBe(0);
      expect(stats.totalFrames).toBe(0);
      expect(stats.strikeRate).toBe(0);
      expect(stats.spareRate).toBe(0);
    });
  });
});
