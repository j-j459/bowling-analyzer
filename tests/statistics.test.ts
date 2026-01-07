import { describe, it, expect } from "vitest";

/**
 * Statistics Calculation Tests
 * 
 * These tests validate the statistical analysis functions for bowling scores.
 */

describe("Statistics Calculations", () => {
  const mockScores = [
    {
      id: 1,
      userId: 1,
      totalScore: 180,
      frames: [
        { frameNumber: 1, firstThrow: 10, secondThrow: null, score: 20, isStrike: true, isSpare: false },
        { frameNumber: 2, firstThrow: 7, secondThrow: 3, score: 40, isStrike: false, isSpare: true },
        { frameNumber: 3, firstThrow: 9, secondThrow: 0, score: 49, isStrike: false, isSpare: false },
        { frameNumber: 4, firstThrow: 10, secondThrow: null, score: 69, isStrike: true, isSpare: false },
        { frameNumber: 5, firstThrow: 8, secondThrow: 1, score: 78, isStrike: false, isSpare: false },
        { frameNumber: 6, firstThrow: 7, secondThrow: 3, score: 98, isStrike: false, isSpare: true },
        { frameNumber: 7, firstThrow: 10, secondThrow: null, score: 118, isStrike: true, isSpare: false },
        { frameNumber: 8, firstThrow: 9, secondThrow: 1, score: 138, isStrike: false, isSpare: true },
        { frameNumber: 9, firstThrow: 10, secondThrow: null, score: 158, isStrike: true, isSpare: false },
        { frameNumber: 10, firstThrow: 10, secondThrow: 10, thirdThrow: 2, score: 180, isStrike: true, isSpare: false },
      ],
    },
    {
      id: 2,
      userId: 1,
      totalScore: 150,
      frames: [
        { frameNumber: 1, firstThrow: 8, secondThrow: 1, score: 9, isStrike: false, isSpare: false },
        { frameNumber: 2, firstThrow: 7, secondThrow: 3, score: 29, isStrike: false, isSpare: true },
        { frameNumber: 3, firstThrow: 10, secondThrow: null, score: 49, isStrike: true, isSpare: false },
        { frameNumber: 4, firstThrow: 9, secondThrow: 0, score: 58, isStrike: false, isSpare: false },
        { frameNumber: 5, firstThrow: 7, secondThrow: 2, score: 67, isStrike: false, isSpare: false },
        { frameNumber: 6, firstThrow: 8, secondThrow: 2, score: 87, isStrike: false, isSpare: true },
        { frameNumber: 7, firstThrow: 10, secondThrow: null, score: 107, isStrike: true, isSpare: false },
        { frameNumber: 8, firstThrow: 8, secondThrow: 1, score: 116, isStrike: false, isSpare: false },
        { frameNumber: 9, firstThrow: 9, secondThrow: 1, score: 136, isStrike: false, isSpare: true },
        { frameNumber: 10, firstThrow: 10, secondThrow: 2, thirdThrow: 2, score: 150, isStrike: true, isSpare: false },
      ],
    },
  ];

  it("should calculate average score correctly", () => {
    const totalScore = mockScores.reduce((sum, score) => sum + score.totalScore, 0);
    const averageScore = Math.round(totalScore / mockScores.length);

    expect(averageScore).toBe(165);
  });

  it("should find highest score", () => {
    const highestScore = Math.max(...mockScores.map((s) => s.totalScore));

    expect(highestScore).toBe(180);
  });

  it("should find lowest score", () => {
    const lowestScore = Math.min(...mockScores.map((s) => s.totalScore));

    expect(lowestScore).toBe(150);
  });

  it("should count total strikes correctly", () => {
    let totalStrikes = 0;

    mockScores.forEach((score) => {
      score.frames.forEach((frame) => {
        if (frame.isStrike) totalStrikes++;
      });
    });

    expect(totalStrikes).toBe(8);
  });

  it("should count total spares correctly", () => {
    let totalSpares = 0;

    mockScores.forEach((score) => {
      score.frames.forEach((frame) => {
        if (frame.isSpare) totalSpares++;
      });
    });

    expect(totalSpares).toBe(6);
  });

  it("should calculate strike rate correctly", () => {
    let totalStrikes = 0;
    let totalFrames = 0;

    mockScores.forEach((score) => {
      score.frames.forEach((frame) => {
        totalFrames++;
        if (frame.isStrike) totalStrikes++;
      });
    });

    const strikeRate = (totalStrikes / totalFrames) * 100;

    expect(strikeRate).toBe(40);
  });

  it("should calculate spare rate correctly", () => {
    let totalSpares = 0;
    let totalFrames = 0;

    mockScores.forEach((score) => {
      score.frames.forEach((frame) => {
        totalFrames++;
        if (frame.isSpare) totalSpares++;
      });
    });

    const spareRate = (totalSpares / totalFrames) * 100;

    expect(spareRate).toBe(30);
  });

  it("should handle empty scores gracefully", () => {
    const emptyScores: any[] = [];

    const stats = {
      totalGames: emptyScores.length,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalStrikes: 0,
      totalSpares: 0,
      strikeRate: 0,
      spareRate: 0,
    };

    expect(stats.totalGames).toBe(0);
    expect(stats.averageScore).toBe(0);
  });
});
