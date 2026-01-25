import { Frame, PinData } from "@/drizzle/schema";

// --- Types ---

export interface PinSuccessRate {
    pinNumber: number;
    successCount: number;
    totalAttempts: number;
    successRate: number; // 0-1
}

export interface AreaAnalysis {
    area: string;
    successRate: number | null; // null represents "no data"
    successCount: number;
    totalAttempts: number;
    assessment: "得意" | "普通" | "苦手" | "データなし";
}

export interface CourseSuggestion {
    targetPin: number;
    standingPosition: string; // e.g., "Left 15 boards"
    targetSpot: string; // e.g., "2nd Arrow"
    advice: string;
    visualData: {
        startBoard: number; // Board number for feet (1-39, center 20)
        targetArrow: number; // Arrow number (1-7)
        path: { x: number; y: number }[]; // Simple path points for visualization
    };
}

// --- Task 1: Area Analysis Logic ---

/**
 * Calculate success rates for specific bowling areas
 * Left: 7, 2
 * Center: 1, 5
 * Right: 10, 3
 */
export const AREA_DEFINITIONS = {
    "左エリア": [7, 2],
    "中央エリア": [1, 5],
    "右エリア": [10, 3],
};

export function analyzeAreasRefined(frames: Frame[]): AreaAnalysis[] {
    // Flatten all pin attempts from frames
    const pinLog: Record<number, { success: number; total: number }> = {};

    // Initialize
    Object.values(AREA_DEFINITIONS).flat().forEach(pin => {
        pinLog[pin] = { success: 0, total: 0 };
    });

    frames.forEach(frame => {
        // Check first throw (if not strike)
        if (!frame.isStrike && frame.secondThrowPins) {
            // Only count spares/misses on the remaining pins? 
            // The requirement is: (knocked count in area / total occurrences of pins in area)
            // Usually "Area Analysis" implies how well you pick up spares in that area.
            // Let's look at the remaining pins after throw 1.

            const remaining = frame.remainingPins || [];
            const knockedInSecond = frame.secondThrowPins.filter(p => p.knocked).map(p => p.pinNumber);

            remaining.forEach(pinNum => {
                if (pinLog[pinNum]) {
                    pinLog[pinNum].total++;
                    if (knockedInSecond.includes(pinNum)) {
                        pinLog[pinNum].success++;
                    }
                }
            });
        }
    });

    return Object.entries(AREA_DEFINITIONS).map(([areaName, targetPins]) => {
        let areaSuccess = 0;
        let areaTotal = 0;

        targetPins.forEach(pin => {
            if (pinLog[pin]) {
                areaSuccess += pinLog[pin].success;
                areaTotal += pinLog[pin].total;
            }
        });

        let successRate: number | null = null;
        let assessment: AreaAnalysis["assessment"] = "データなし";

        if (areaTotal > 0) {
            successRate = areaSuccess / areaTotal;
            if (successRate >= 0.7) assessment = "得意";
            else if (successRate >= 0.4) assessment = "普通";
            else assessment = "苦手";
        }

        return {
            area: areaName,
            successRate,
            successCount: areaSuccess,
            totalAttempts: areaTotal,
            assessment,
        };
    });
}


// --- Task 2: Course Suggestion Logic (3-6-9 System) ---

// Key Pin mapping: Which pin is the key pin (most forward pin)?
// Simplified logic: Find the lowest numbered pin remaining.
function getKeyPin(remainingPins: number[]): number | null {
    if (remainingPins.length === 0) return null;
    return Math.min(...remainingPins);
}

/**
 * Generate course suggestion based on remaining pins using 3-6-9 system
 * Assuming right-handed bowler for simplicity (can be parameterized later)
 */
export function getCourseSuggestion(remainingPins: number[]): CourseSuggestion | null {
    const keyPin = getKeyPin(remainingPins);
    if (!keyPin) return null;

    // Standard 3-6-9 Adjustment for Right Hander
    // Strike position (base) assumed at board 20 (center), aiming for 2nd arrow (board 10) for pocket (1-3)
    // But for spares, we usually use the 3-6-9 system based on the 2nd arrow or 3rd arrow.

    // Let's use a simplified "3-6-9" logic:
    // Base: Key pin 1, 5 -> Stand Center (20), Target 2nd Arrow (10)
    // Key pin 2, 8 -> Move Right 3 boards (17)
    // Key pin 4, 7 -> Move Right 6 boards (14)
    // Key pin 3, 9 -> Move Left 3 boards (23)
    // Key pin 6, 10 -> Move Left 6 boards (26)

    let moveDescription = "";
    let baseBoard = 20; // Center dot
    let targetArrow = 2; // 2nd arrow from right (board 10)
    let adviceText = "";

    switch (keyPin) {
        case 1:
        case 5:
            moveDescription = "基本の立ち位置（センター）";
            baseBoard = 20;
            adviceText = "ストライクコースと同じように、第2スパットを狙って投げてください。";
            break;
        case 2:
        case 8:
            moveDescription = "右に3枚移動";
            baseBoard = 17;
            adviceText = "右に3枚移動し、第2スパットを通して対角線を意識してください。";
            break;
        case 4:
        case 7:
            moveDescription = "右に6枚移動";
            baseBoard = 14;
            adviceText = "右に6枚移動し、第2スパットを通してクロスラインを狙ってください。";
            break;
        case 3:
        case 9:
            moveDescription = "左に3枚移動";
            baseBoard = 23;
            adviceText = "左に3枚移動し、第2スパットと第3スパットの間を狙ってください。";
            break;
        case 6:
        case 10:
            moveDescription = "左に6枚〜9枚移動";
            baseBoard = 29; // Deep inside line
            targetArrow = 3; // Aiming for 3rd arrow usually for 10 pin is common, but basic 3-6-9 uses 2nd arrow.
            // Let's stick to standard 3-6-9 variation: Move LEFT for Right-side pins.
            adviceText = "大きく左に移動し（約9枚）、第3スパット付近を通してまっすぐ狙いましょう。";
            break;
        default:
            moveDescription = "基本の立ち位置";
            adviceText = "残ったピンの中で一番手前のピンを狙いましょう。";
    }

    // Create a simple path for visualization
    // Start: baseBoard (x), y=0
    // Mid: targetArrow (board 10 or 15), y=15 (approx arrow distance)
    // End: Pin Position
    const pinPositions: Record<number, number> = {
        1: 20,
        2: 15, 3: 25,
        4: 10, 5: 20, 6: 30,
        7: 5, 8: 15, 9: 25, 10: 35
    };

    // Board numbering: 1 is right gutter, 39 is left gutter.
    // We'll map visual coordinates to this logic roughly.

    return {
        targetPin: keyPin,
        standingPosition: moveDescription,
        targetSpot: `第${targetArrow}スパット`,
        advice: adviceText,
        visualData: {
            startBoard: baseBoard,
            targetArrow: targetArrow,
            path: [
                { x: baseBoard, y: 0 },
                { x: (targetArrow * 5), y: 15 }, // Arrow position approx (Arrow 1=5, 2=10, 3=15... from right)
                { x: pinPositions[keyPin], y: 60 } // Pin deck end
            ]
        }
    };
}
