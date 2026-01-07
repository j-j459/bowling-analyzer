import React, { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { BowlingLane } from "@/components/bowling-lane";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  calculatePinSuccessRates,
  analyzeAreas,
  getAnalysisRecommendations,
  calculateStrikeSpareStats,
} from "@/lib/bowling-analysis";

export default function AnalysisScreen() {
  const colors = useColors();
  const { scoreId } = useLocalSearchParams<{ scoreId: string }>();
  const { data: score, isLoading } = trpc.scores.get.useQuery(
    { id: parseInt(scoreId || "0") },
    { enabled: !!scoreId }
  );

  const analysis = useMemo(() => {
    if (!score?.frames) return null;

    const pinRates = calculatePinSuccessRates(score.frames);
    const areas = analyzeAreas(pinRates);
    const recommendations = getAnalysisRecommendations(areas);
    const strikeSpareStats = calculateStrikeSpareStats(score.frames);

    return {
      pinRates,
      areas,
      recommendations,
      strikeSpareStats,
    };
  }, [score?.frames]);

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-base text-muted">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  if (!score || !analysis) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-base text-error">スコアが見つかりません</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              スコア分析
            </Text>
            <Text className="text-sm text-muted">
              {new Date(score.date).toLocaleDateString("ja-JP")}
            </Text>
          </View>

          {/* Score Summary */}
          <View
            className="bg-surface rounded-lg p-4 gap-3"
            style={{ borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-lg font-semibold text-foreground">
              スコアサマリー
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">
                  {score.totalScore}
                </Text>
                <Text className="text-xs text-muted">総スコア</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                  {analysis.strikeSpareStats.strikeCount}
                </Text>
                <Text className="text-xs text-muted">ストライク</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: colors.warning }}>
                  {analysis.strikeSpareStats.spareCount}
                </Text>
                <Text className="text-xs text-muted">スペア</Text>
              </View>
            </View>
          </View>

          {/* Bowling Lane Analysis */}
          <View
            className="bg-surface rounded-lg p-4 gap-3"
            style={{ borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-lg font-semibold text-foreground">
              ピン別成功率
            </Text>
            <View className="items-center py-4">
              <BowlingLane
                pinSuccessRates={analysis.pinRates}
                width={250}
                height={350}
                showLabels={true}
              />
            </View>
          </View>

          {/* Area Analysis */}
          <View
            className="bg-surface rounded-lg p-4 gap-3"
            style={{ borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-lg font-semibold text-foreground">
              エリア別分析
            </Text>
            <View className="gap-2">
              {analysis.areas.map((area) => (
                <View
                  key={area.area}
                  className="flex-row items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: colors.background }}
                >
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground">
                      {area.area}
                    </Text>
                    <Text className="text-xs text-muted">
                      成功率: {(area.successRate * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        area.assessment === "得意"
                          ? colors.success
                          : area.assessment === "普通"
                            ? colors.warning
                            : colors.error,
                    }}
                  >
                    <Text className="text-xs font-semibold text-background">
                      {area.assessment}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recommendations */}
          {(analysis.recommendations.strengths.length > 0 ||
            analysis.recommendations.weaknesses.length > 0) && (
            <View
              className="bg-surface rounded-lg p-4 gap-3"
              style={{ borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-lg font-semibold text-foreground">
                分析結果
              </Text>

              {analysis.recommendations.strengths.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    💪 得意な点
                  </Text>
                  {analysis.recommendations.strengths.map((strength, idx) => (
                    <Text key={idx} className="text-sm text-foreground pl-2">
                      • {strength}
                    </Text>
                  ))}
                </View>
              )}

              {analysis.recommendations.weaknesses.length > 0 && (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    🎯 改善ポイント
                  </Text>
                  {analysis.recommendations.weaknesses.map((weakness, idx) => (
                    <Text key={idx} className="text-sm text-foreground pl-2">
                      • {weakness}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Frame Details */}
          <View
            className="bg-surface rounded-lg p-4 gap-3"
            style={{ borderColor: colors.border, borderWidth: 1 }}
          >
            <Text className="text-lg font-semibold text-foreground">
              フレーム別詳細
            </Text>
            <View className="gap-2">
              {score.frames.map((frame) => (
                <View
                  key={frame.frameNumber}
                  className="flex-row items-center justify-between p-2 rounded"
                  style={{ backgroundColor: colors.background }}
                >
                  <Text className="text-sm font-medium text-foreground w-12">
                    F{frame.frameNumber}
                  </Text>
                  <View className="flex-row gap-2 flex-1">
                    <Text className="text-sm text-muted">
                      {frame.firstThrow ?? "-"}
                    </Text>
                    {!frame.isStrike && (
                      <>
                        <Text className="text-sm text-muted">/</Text>
                        <Text className="text-sm text-muted">
                          {frame.secondThrow ?? "-"}
                        </Text>
                      </>
                    )}
                  </View>
                  <View className="flex-row gap-1">
                    {frame.isStrike && (
                      <View className="bg-success px-2 py-1 rounded">
                        <Text className="text-xs font-bold text-background">
                          X
                        </Text>
                      </View>
                    )}
                    {frame.isSpare && !frame.isStrike && (
                      <View className="bg-warning px-2 py-1 rounded">
                        <Text className="text-xs font-bold text-background">
                          /
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm font-semibold text-foreground w-12 text-right">
                    {frame.score}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
