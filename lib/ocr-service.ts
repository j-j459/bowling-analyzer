import { Frame } from "@/lib/local-scores";

/**
 * OCR Service - Offline Score Extraction
 * 
 * This service provides score extraction functionality.
 * In production, this would use a real OCR library like Tesseract.js
 * For now, it provides a demo mode with simulated extraction.
 */

export interface OCRResult {
    success: boolean;
    totalScore: number | null;
    frames: Frame[];
    confidence: number;
    message: string;
}

/**
 * Simulate OCR extraction from an image
 * In a real implementation, this would use Tesseract.js or similar
 */
export async function extractScoreFromImage(imageUri: string): Promise<OCRResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo purposes, generate a realistic random score
    const totalScore = Math.floor(Math.random() * 150) + 80; // 80-230 range
    const frames = generateFramesFromScore(totalScore);

    return {
        success: true,
        totalScore,
        frames,
        confidence: 0.85,
        message: "スコアを読み取りました（デモモード）",
    };
}

/**
 * Generate realistic frames from a total score
 */
export function generateFramesFromScore(totalScore: number): Frame[] {
    const frames: Frame[] = [];
    let remainingScore = totalScore;
    let cumulativeScore = 0;

    for (let i = 1; i <= 10; i++) {
        // Calculate average per remaining frames
        const remainingFrames = 11 - i;
        const avgPerFrame = Math.floor(remainingScore / remainingFrames);

        // Add some variance
        const variance = Math.floor(Math.random() * 6) - 3; // -3 to +2
        let frameScore = Math.max(0, Math.min(10, avgPerFrame + variance));

        // Last frame gets the remainder
        if (i === 10) {
            frameScore = Math.min(30, remainingScore); // Max 30 for 10th frame
        }

        remainingScore -= frameScore;
        cumulativeScore += frameScore;

        const isStrike = frameScore >= 10 && i < 10;
        const firstThrow = isStrike ? 10 : Math.min(frameScore, 9);
        const secondThrow = isStrike ? null : (frameScore - firstThrow);
        const isSpare = !isStrike && firstThrow + (secondThrow || 0) === 10;

        // Generate remaining pins for non-strike frames
        const remainingPins: number[] = [];
        if (!isStrike && firstThrow < 10) {
            const pinsLeft = 10 - firstThrow;
            for (let p = 1; p <= pinsLeft; p++) {
                remainingPins.push(p);
            }
        }

        frames.push({
            frameNumber: i,
            firstThrow,
            secondThrow,
            score: cumulativeScore,
            isStrike,
            isSpare,
            remainingPins,
        });
    }

    return frames;
}

/**
 * Validate if an image can be processed
 */
export function isValidImage(uri: string): boolean {
    if (!uri) return false;

    // Check for common image extensions
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const lowerUri = uri.toLowerCase();

    // Data URIs are valid
    if (lowerUri.startsWith('data:image/')) return true;

    // File URIs
    if (lowerUri.startsWith('file://') || lowerUri.startsWith('content://')) return true;

    // Check extension
    return validExtensions.some(ext => lowerUri.endsWith(ext));
}

/**
 * Get analysis advice based on frames
 */
export function getQuickAnalysis(frames: Frame[]): string[] {
    const advice: string[] = [];

    const strikes = frames.filter(f => f.isStrike).length;
    const spares = frames.filter(f => f.isSpare).length;

    if (strikes >= 5) {
        advice.push("🎯 ストライク率が高い！調子が良いですね");
    } else if (strikes <= 1) {
        advice.push("💡 ストライクを狙うには、1番ピンと3番ピンの間を狙いましょう");
    }

    if (spares >= 5) {
        advice.push("✨ スペア率が優秀です！安定した投球ができています");
    }

    // Check for common missed pins
    const missedPins = new Map<number, number>();
    frames.forEach(f => {
        if (f.remainingPins) {
            f.remainingPins.forEach(pin => {
                missedPins.set(pin, (missedPins.get(pin) || 0) + 1);
            });
        }
    });

    // Find most commonly missed pin
    let maxMissed = 0;
    let worstPin = 0;
    missedPins.forEach((count, pin) => {
        if (count > maxMissed) {
            maxMissed = count;
            worstPin = pin;
        }
    });

    if (worstPin > 0 && maxMissed >= 3) {
        const pinAdvice: Record<number, string> = {
            7: "左に板2枚分移動して投げましょう",
            10: "右に板2枚分移動して投げましょう",
            4: "左側のアプローチを見直しましょう",
            6: "右側のアプローチを見直しましょう",
        };
        advice.push(`⚠️ ${worstPin}番ピンが残りやすいです。${pinAdvice[worstPin] || "立ち位置を調整しましょう"}`);
    }

    return advice;
}
