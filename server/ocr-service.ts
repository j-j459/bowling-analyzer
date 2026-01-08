import { invokeLLM } from "./_core/llm";

export interface ScoreData {
  frames: Array<{
    frameNumber: number;
    firstThrow: number | null;
    secondThrow: number | null;
    thirdThrow?: number | null;
    isStrike: boolean;
    isSpare: boolean;
  }>;
  totalScore: number;
  playerName?: string;
}

export interface OCRResult {
  scores: ScoreData[];
  confidence: number;
  rawText: string;
}

/**
 * Extract multiple bowling scores from a single image using LLM
 * Returns all scores found in the image
 */
export async function extractBowlingScoresFromImage(
  imageUrl: string
): Promise<OCRResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a bowling score analyzer. Extract ALL bowling scores from the image.
          
For each score/game found:
1. Identify the player name (if visible)
2. Extract frame-by-frame scores (frames 1-10)
3. Identify strikes (X) and spares (/)
4. Calculate total score

Return a JSON array of all scores found in the image.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all bowling scores from this image. Return JSON array with this structure for each score:\n{\n  \"playerName\": \"string or null\",\n  \"frames\": [{\"frameNumber\": 1-10, \"firstThrow\": 0-10 or null, \"secondThrow\": 0-10 or null, \"thirdThrow\": 0-10 or null (only for frame 10), \"isStrike\": boolean, \"isSpare\": boolean}],\n  \"totalScore\": number\n}",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr);

    // Normalize the response
    const scores = Array.isArray(parsed) ? parsed : parsed.scores || [parsed];

    // Validate and clean up scores
    const validatedScores = scores
      .map((score: any): ScoreData | null => validateScoreData(score))
      .filter((score: ScoreData | null): score is ScoreData => score !== null);

    // Store raw text from content
    const rawText = typeof content === 'string' ? content : JSON.stringify(content);

    return {
      scores: validatedScores,
      confidence: validatedScores.length > 0 ? 0.85 : 0,
      rawText,
    };
  } catch (error) {
    console.error("[OCR] Error extracting bowling scores:", error);
    throw new Error("Failed to extract bowling scores from image");
  }
}

/**
 * Validate and normalize score data
 */
function validateScoreData(data: any): ScoreData | null {
  try {
    if (!data || !Array.isArray(data.frames)) {
      return null;
    }

    // Validate frames
    const validatedFrames = data.frames
      .filter((f: any) => f && typeof f.frameNumber === "number")
      .map((frame: any) => ({
        frameNumber: Math.min(10, Math.max(1, frame.frameNumber)),
        firstThrow:
          frame.firstThrow !== null && frame.firstThrow !== undefined
            ? Math.min(10, Math.max(0, frame.firstThrow))
            : null,
        secondThrow:
          frame.secondThrow !== null && frame.secondThrow !== undefined
            ? Math.min(10, Math.max(0, frame.secondThrow))
            : null,
        thirdThrow:
          frame.thirdThrow !== null && frame.thirdThrow !== undefined
            ? Math.min(10, Math.max(0, frame.thirdThrow))
            : undefined,
        isStrike: frame.isStrike === true,
        isSpare: frame.isSpare === true,
      }));

    if (validatedFrames.length === 0) {
      return null;
    }

    // Calculate total score if not provided
    let totalScore = data.totalScore || 0;
    if (totalScore === 0) {
      totalScore = calculateTotalScore(validatedFrames);
    }

    return {
      frames: validatedFrames,
      totalScore: Math.min(300, Math.max(0, totalScore)),
      playerName: data.playerName || undefined,
    };
  } catch (error) {
    console.error("[OCR] Error validating score data:", error);
    return null;
  }
}

/**
 * Calculate total bowling score from frames
 */
function calculateTotalScore(
  frames: Array<{
    frameNumber: number;
    firstThrow: number | null;
    secondThrow: number | null;
    thirdThrow?: number | null;
    isStrike: boolean;
    isSpare: boolean;
  }>
): number {
  let score = 0;

  for (let i = 0; i < frames.length && i < 10; i++) {
    const frame = frames[i];
    const nextFrame = frames[i + 1];
    const frameAfterNext = frames[i + 2];

    if (frame.isStrike) {
      score += 10;
      // Add next two throws
      if (nextFrame) {
        if (nextFrame.isStrike) {
          score += 10;
          if (frameAfterNext) {
            score += frameAfterNext.firstThrow || 0;
          }
        } else {
          score += (nextFrame.firstThrow || 0) + (nextFrame.secondThrow || 0);
        }
      }
    } else if (frame.isSpare) {
      score += 10;
      // Add next throw
      if (nextFrame) {
        score += nextFrame.firstThrow || 0;
      }
    } else {
      score += (frame.firstThrow || 0) + (frame.secondThrow || 0);
    }
  }

  return score;
}

/**
 * Extract text from image using OCR (fallback if JSON extraction fails)
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Extract all text from the image. Focus on bowling scores and frame numbers.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this bowling score image:",
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error("[OCR] Error extracting text:", error);
    return "";
  }
}
