import { Frame, PinData } from "@/drizzle/schema";

export interface PinSuccessRate {
  pinNumber: number;
  successCount: number;
  totalAttempts: number;
  successRate: number; // 0-1
}

export interface AreaAnalysis {
  area: string;
  successRate: number;
  assessment: "得意" | "普通" | "苦手";
}

/**
 * Calculate success rate for each pin across multiple frames
 */
export function calculatePinSuccessRates(frames: Frame[]): PinSuccessRate[] {
  const pinStats: Record<number, { success: number; total: number }> = {};

  // Initialize pin stats
  for (let i = 1; i <= 10; i++) {
    pinStats[i] = { success: 0, total: 0 };
  }

  // Process each frame
  frames.forEach((frame) => {
    // First throw pins
    if (frame.firstThrowPins && frame.firstThrowPins.length > 0) {
      frame.firstThrowPins.forEach((pin) => {
        pinStats[pin.pinNumber].total++;
        if (pin.knocked) {
          pinStats[pin.pinNumber].success++;
        }
      });
    }

    // Second throw pins (only if not a strike)
    if (!frame.isStrike && frame.secondThrowPins && frame.secondThrowPins.length > 0) {
      frame.secondThrowPins.forEach((pin) => {
        pinStats[pin.pinNumber].total++;
        if (pin.knocked) {
          pinStats[pin.pinNumber].success++;
        }
      });
    }
  });

  // Convert to array and calculate success rates
  return Object.entries(pinStats)
    .map(([pinNum, stats]) => ({
      pinNumber: parseInt(pinNum),
      successCount: stats.success,
      totalAttempts: stats.total,
      successRate: stats.total > 0 ? stats.success / stats.total : 0,
    }))
    .sort((a, b) => a.pinNumber - b.pinNumber);
}

/**
 * Analyze bowling areas based on pin success rates
 * Pins are divided into areas:
 * - Left: 7, 4, 2
 * - Center: 8, 5, 1, 3, 9
 * - Right: 10, 6
 * - Front: 1, 2, 3 (closer to bowler)
 * - Back: 7, 8, 9, 10 (farther from bowler)
 */
export function analyzeAreas(pinSuccessRates: PinSuccessRate[]): AreaAnalysis[] {
  const rateMap = new Map(pinSuccessRates.map((p) => [p.pinNumber, p.successRate]));

  const areas = {
    "左エリア": [7, 4, 2],
    "中央エリア": [8, 5, 1, 3, 9],
    "右エリア": [10, 6],
    "前方エリア": [1, 2, 3],
    "後方エリア": [7, 8, 9, 10],
  };

  return Object.entries(areas).map(([areaName, pins]) => {
    const rates = pins
      .map((pin) => rateMap.get(pin) ?? 0)
      .filter((rate) => rate > 0);

    const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

    let assessment: "得意" | "普通" | "苦手";
    if (avgRate >= 0.65) {
      assessment = "得意";
    } else if (avgRate >= 0.35) {
      assessment = "普通";
    } else {
      assessment = "苦手";
    }

    return {
      area: areaName,
      successRate: avgRate,
      assessment,
    };
  });
}

/**
 * Get specific weakness and strength recommendations
 */
export function getAnalysisRecommendations(areas: AreaAnalysis[]): {
  strengths: string[];
  weaknesses: string[];
} {
  const strengths = areas
    .filter((a) => a.assessment === "得意")
    .map((a) => `${a.area}は得意です（成功率: ${(a.successRate * 100).toFixed(0)}%）`);

  const weaknesses = areas
    .filter((a) => a.assessment === "苦手")
    .map((a) => `${a.area}を改善する必要があります（成功率: ${(a.successRate * 100).toFixed(0)}%）`);

  return { strengths, weaknesses };
}

/**
 * Calculate strike and spare statistics
 */
export function calculateStrikeSpareStats(frames: Frame[]): {
  strikeRate: number;
  spareRate: number;
  strikeCount: number;
  spareCount: number;
  totalFrames: number;
} {
  const strikeCount = frames.filter((f) => f.isStrike).length;
  const spareCount = frames.filter((f) => f.isSpare && !f.isStrike).length;
  const totalFrames = frames.length;

  return {
    strikeRate: totalFrames > 0 ? strikeCount / totalFrames : 0,
    spareRate: totalFrames > 0 ? spareCount / totalFrames : 0,
    strikeCount,
    spareCount,
    totalFrames,
  };
}
