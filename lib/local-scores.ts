import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SCORES_STORAGE_KEY = "bowling_analyzer_scores";

// Score type matching the server schema
export interface LocalScore {
    id: number;
    date: string;
    location: string | null;
    totalScore: number;
    gameNumber: number;
    frames: Frame[];
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Frame {
    frameNumber: number;
    firstThrow: number | null;
    secondThrow: number | null;
    thirdThrow?: number | null;
    score: number;
    isStrike: boolean;
    isSpare: boolean;
    remainingPins?: number[];
    firstThrowPins?: PinData[];
    secondThrowPins?: PinData[];
}

export interface PinData {
    pinNumber: number;
    knocked: boolean;
}

/**
 * Generate a unique local ID
 */
function generateLocalId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Get all scores from local storage
 */
export async function getLocalScores(): Promise<LocalScore[]> {
    try {
        let data: string | null = null;

        if (Platform.OS === "web") {
            data = window.localStorage.getItem(SCORES_STORAGE_KEY);
        } else {
            data = await AsyncStorage.getItem(SCORES_STORAGE_KEY);
        }

        if (!data) {
            return [];
        }

        const scores = JSON.parse(data) as LocalScore[];
        // Sort by date descending (newest first)
        return scores.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
        console.error("[LocalScores] Failed to get scores:", error);
        return [];
    }
}

/**
 * Get a single score by ID
 */
export async function getLocalScoreById(id: number): Promise<LocalScore | null> {
    try {
        const scores = await getLocalScores();
        return scores.find((s) => s.id === id) || null;
    } catch (error) {
        console.error("[LocalScores] Failed to get score by ID:", error);
        return null;
    }
}

/**
 * Save scores to local storage
 */
async function saveScoresToStorage(scores: LocalScore[]): Promise<void> {
    const data = JSON.stringify(scores);

    if (Platform.OS === "web") {
        window.localStorage.setItem(SCORES_STORAGE_KEY, data);
    } else {
        await AsyncStorage.setItem(SCORES_STORAGE_KEY, data);
    }
}

/**
 * Add a new score to local storage
 */
export async function addLocalScore(score: Omit<LocalScore, "id" | "createdAt" | "updatedAt">): Promise<LocalScore> {
    try {
        const scores = await getLocalScores();
        const now = new Date().toISOString();

        const newScore: LocalScore = {
            ...score,
            id: generateLocalId(),
            createdAt: now,
            updatedAt: now,
        };

        scores.unshift(newScore); // Add to beginning
        await saveScoresToStorage(scores);

        console.log("[LocalScores] Score added:", newScore.id);
        return newScore;
    } catch (error) {
        console.error("[LocalScores] Failed to add score:", error);
        throw new Error("スコアの保存に失敗しました");
    }
}

/**
 * Update an existing score
 */
export async function updateLocalScore(id: number, updates: Partial<LocalScore>): Promise<LocalScore | null> {
    try {
        const scores = await getLocalScores();
        const index = scores.findIndex((s) => s.id === id);

        if (index === -1) {
            return null;
        }

        const updatedScore = {
            ...scores[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        scores[index] = updatedScore;
        await saveScoresToStorage(scores);

        console.log("[LocalScores] Score updated:", id);
        return updatedScore;
    } catch (error) {
        console.error("[LocalScores] Failed to update score:", error);
        throw new Error("スコアの更新に失敗しました");
    }
}

/**
 * Delete a score
 */
export async function deleteLocalScore(id: number): Promise<boolean> {
    try {
        const scores = await getLocalScores();
        const filteredScores = scores.filter((s) => s.id !== id);

        if (filteredScores.length === scores.length) {
            return false; // Score not found
        }

        await saveScoresToStorage(filteredScores);
        console.log("[LocalScores] Score deleted:", id);
        return true;
    } catch (error) {
        console.error("[LocalScores] Failed to delete score:", error);
        throw new Error("スコアの削除に失敗しました");
    }
}

/**
 * Get statistics from local scores
 */
export async function getLocalStatistics(): Promise<{
    totalGames: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    totalStrikes: number;
    totalSpares: number;
    strikeRate: number;
    spareRate: number;
}> {
    try {
        const scores = await getLocalScores();

        if (scores.length === 0) {
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

        const totalGames = scores.length;
        const totalScoreSum = scores.reduce((sum, s) => sum + s.totalScore, 0);
        const averageScore = Math.round(totalScoreSum / totalGames);
        const highestScore = Math.max(...scores.map((s) => s.totalScore));
        const lowestScore = Math.min(...scores.map((s) => s.totalScore));

        // Count strikes and spares
        let totalStrikes = 0;
        let totalSpares = 0;
        let totalFirstThrows = 0;
        let totalSpareOpportunities = 0;

        for (const score of scores) {
            for (const frame of score.frames) {
                if (frame.isStrike) {
                    totalStrikes++;
                }
                if (frame.isSpare) {
                    totalSpares++;
                }
                totalFirstThrows++;
                if (!frame.isStrike) {
                    totalSpareOpportunities++;
                }
            }
        }

        const strikeRate = totalFirstThrows > 0 ? (totalStrikes / totalFirstThrows) * 100 : 0;
        const spareRate = totalSpareOpportunities > 0 ? (totalSpares / totalSpareOpportunities) * 100 : 0;

        return {
            totalGames,
            averageScore,
            highestScore,
            lowestScore,
            totalStrikes,
            totalSpares,
            strikeRate,
            spareRate,
        };
    } catch (error) {
        console.error("[LocalScores] Failed to get statistics:", error);
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
}
