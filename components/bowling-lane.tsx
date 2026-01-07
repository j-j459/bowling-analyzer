import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Text as SvgText, Rect } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";

interface PinSuccessRate {
  pinNumber: number;
  successRate: number; // 0-1
  successCount: number;
  totalAttempts: number;
}

interface BowlingLaneProps {
  pinSuccessRates?: PinSuccessRate[];
  width?: number;
  height?: number;
  showLabels?: boolean;
}

// Pin positions in standard 10-pin bowling layout
const PIN_POSITIONS: Record<number, { x: number; y: number }> = {
  1: { x: 50, y: 85 },
  2: { x: 35, y: 75 },
  3: { x: 65, y: 75 },
  4: { x: 20, y: 65 },
  5: { x: 50, y: 65 },
  6: { x: 80, y: 65 },
  7: { x: 5, y: 55 },
  8: { x: 35, y: 55 },
  9: { x: 65, y: 55 },
  10: { x: 95, y: 55 },
};

// Get color based on success rate
const getColorForSuccessRate = (successRate: number): string => {
  if (successRate >= 0.8) return "#22C55E"; // Green - excellent
  if (successRate >= 0.6) return "#84CC16"; // Lime - good
  if (successRate >= 0.4) return "#FBBF24"; // Amber - fair
  if (successRate >= 0.2) return "#FB923C"; // Orange - poor
  return "#EF4444"; // Red - very poor
};

export function BowlingLane({
  pinSuccessRates = [],
  width = 200,
  height = 400,
  showLabels = true,
}: BowlingLaneProps) {
  const colors = useColors();

  // Create a map for quick lookup
  const successRateMap = new Map(
    pinSuccessRates.map((p) => [p.pinNumber, p])
  );

  return (
    <View className="items-center gap-4">
      <Svg width={width} height={height} viewBox="0 0 100 100">
        {/* Lane background */}
        <Rect x="10" y="0" width="80" height="100" fill="#E0E7FF" rx="5" />

        {/* Pins */}
        {Object.entries(PIN_POSITIONS).map(([pinNum, pos]) => {
          const pinNumber = parseInt(pinNum);
          const rateData = successRateMap.get(pinNumber);
          const successRate = rateData?.successRate ?? 0.5;
          const pinColor = getColorForSuccessRate(successRate);

          return (
            <g key={pinNumber}>
              {/* Pin circle */}
              <Circle
                cx={pos.x}
                cy={pos.y}
                r="4"
                fill={pinColor}
                stroke="#333"
                strokeWidth="0.5"
              />
              {/* Pin number */}
              <SvgText
                x={pos.x}
                y={pos.y + 1}
                fontSize="2.5"
                fontWeight="bold"
                textAnchor="middle"
                fill="#000"
              >
                {pinNumber}
              </SvgText>
            </g>
          );
        })}

        {/* Ball direction arrow */}
        <SvgText
          x="50"
          y="95"
          fontSize="3"
          textAnchor="middle"
          fill="#999"
        >
          ↑
        </SvgText>
      </Svg>

      {/* Legend */}
      {showLabels && (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded-full" style={{ backgroundColor: "#22C55E" }} />
            <Text className="text-xs text-foreground">得意 (80%以上)</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded-full" style={{ backgroundColor: "#FBBF24" }} />
            <Text className="text-xs text-foreground">普通 (40-60%)</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 rounded-full" style={{ backgroundColor: "#EF4444" }} />
            <Text className="text-xs text-foreground">苦手 (20%以下)</Text>
          </View>
        </View>
      )}
    </View>
  );
}
