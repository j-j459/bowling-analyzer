import React from "react";
import { View, Text } from "react-native";
import Svg, {
    Path,
    Circle,
    Line,
    Polygon,
    G,
    Rect,
    Text as SvgText,
} from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { CourseSuggestion } from "@/lib/bowling-logic";

interface CourseSuggestionProps {
    suggestion: CourseSuggestion;
    remainingPins: number[];
}

export function CourseSuggestionView({
    suggestion,
    remainingPins,
}: CourseSuggestionProps) {
    const colors = useColors();

    // Lane dimensions
    const LANE_WIDTH = 300;
    const LANE_HEIGHT = 400;

    // Coordinate mapping function
    // Input: Board number (1-39, 1 is Right, 20 is Center, 39 is Left)
    // Output: X coordinate (0-300)
    const getX = (board: number) => {
        // Board 1 -> X = LANE_WIDTH (Right side)
        // Board 20 -> X = LANE_WIDTH / 2
        // Board 39 -> X = 0 (Left side)
        // Formula: (40 - board) * (LANE_WIDTH / 40)
        return (40 - board) * (LANE_WIDTH / 40);
    };

    const getY = (yPerc: number) => {
        return LANE_HEIGHT - (yPerc / 60) * LANE_HEIGHT;
    };

    // Pin positions (Standard Triangle) - Y is distance from foul line (0-60ft)
    const pinCoords: Record<number, { b: number; y: number }> = {
        1: { b: 20, y: 60 },
        2: { b: 15, y: 60 },
        3: { b: 25, y: 60 },
        4: { b: 10, y: 60 },
        5: { b: 20, y: 60 },
        6: { b: 30, y: 60 },
        7: { b: 5, y: 60 },
        8: { b: 15, y: 60 },
        9: { b: 25, y: 60 },
        10: { b: 35, y: 60 },
    };

    // Adjust Y slightly for triangle depth
    // Row 1: Pin 1 (Head pin)
    // Row 2: 2, 3
    // Row 3: 4, 5, 6
    // Row 4: 7, 8, 9, 10
    const pinLayoutY = {
        1: 56,
        2: 57, 3: 57,
        4: 58, 5: 58, 6: 58,
        7: 59, 8: 59, 9: 59, 10: 59
    };

    return (
        <View className="bg-card rounded-lg p-4 gap-4">
            <View className="gap-2">
                <Text className="text-xl font-bold text-foreground">
                    {suggestion.targetPin}番ピン攻略のアドバイス
                </Text>
                <Text className="text-base font-semibold text-primary">
                    {suggestion.standingPosition}
                </Text>
                <Text className="text-sm text-foreground">{suggestion.advice}</Text>
            </View>

            <View className="items-center justify-center bg-gray-900 rounded-lg p-4">
                <Svg width={LANE_WIDTH} height={LANE_HEIGHT} viewBox={`0 0 ${LANE_WIDTH} ${LANE_HEIGHT}`}>
                    {/* Lane Surface */}
                    <Rect x="0" y="0" width={LANE_WIDTH} height={LANE_HEIGHT} fill="#F0C589" opacity={0.3} />

                    {/* Gutters */}
                    <Rect x="0" y="0" width={LANE_WIDTH * 0.05} height={LANE_HEIGHT} fill="#111" />
                    <Rect x={LANE_WIDTH * 0.95} y="0" width={LANE_WIDTH * 0.05} height={LANE_HEIGHT} fill="#111" />

                    {/* Arrows (Spats) at ~15ft */}
                    {[5, 10, 15, 20, 25, 30, 35].map((board) => (
                        <Polygon
                            key={`arrow-${board}`}
                            points={`${getX(board)},${getY(15)} ${getX(board) - 5},${getY(16)} ${getX(board) + 5},${getY(16)}`}
                            fill="black"
                            opacity={0.5}
                        />
                    ))}

                    {/* Foul Line */}
                    <Line
                        x1="0" y1={LANE_HEIGHT - 2}
                        x2={LANE_WIDTH} y2={LANE_HEIGHT - 2}
                        stroke="black"
                        strokeWidth="2"
                    />

                    {/* Pins */}
                    {Object.entries(pinCoords).map(([numStr, pos]) => {
                        const num = parseInt(numStr);
                        const isRemaining = remainingPins.includes(num);
                        const isTarget = num === suggestion.targetPin;
                        const px = getX(pos.b);
                        const py = getY(pinLayoutY[num as keyof typeof pinLayoutY]);

                        return (
                            <G key={num}>
                                <Circle
                                    cx={px}
                                    cy={py}
                                    r={8}
                                    fill={isRemaining ? (isTarget ? "#ef4444" : "white") : "#444"} // Red for target, White for remaining, Dark for knocked
                                    stroke="black"
                                    strokeWidth={1}
                                />
                                <SvgText
                                    x={px}
                                    y={py + 3}
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill="black"
                                    textAnchor="middle"
                                >
                                    {num}
                                </SvgText>
                            </G>
                        );
                    })}

                    {/* Visualization: Path */}
                    <Path
                        d={`M${getX(suggestion.visualData.startBoard)} ${LANE_HEIGHT - 10} 
               Q ${getX(suggestion.visualData.targetArrow * 5)} ${getY(15)} 
                 ${getX(pinCoords[suggestion.targetPin].b)} ${getY(pinLayoutY[suggestion.targetPin as keyof typeof pinLayoutY])}`}
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth="3"
                        strokeDasharray="5, 5"
                    />

                    {/* Visualization: Feet Position */}
                    <G x={getX(suggestion.visualData.startBoard) - 10} y={LANE_HEIGHT - 40}>
                        {/* Simple Feet Icon */}
                        <Path d="M5,0 C2,0 0,5 0,10 C0,18 5,20 5,20 C5,20 10,18 10,10 C10,5 8,0 5,0 Z" fill={colors.primary} />
                        <Path d="M15,0 C12,0 10,5 10,10 C10,18 15,20 15,20 C15,20 20,18 20,10 C20,5 18,0 15,0 Z" fill={colors.primary} />
                    </G>

                </Svg>
            </View>
        </View>
    );
}
