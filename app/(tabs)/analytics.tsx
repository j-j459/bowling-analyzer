import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function AnalyticsScreen() {
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const { data: statistics, isLoading } = trpc.scores.statistics.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <IconSymbol name="chart.bar.fill" size={64} color={colors.muted} />
        <Text className="text-lg font-semibold text-foreground mt-4">分析データなし</Text>
        <Text className="text-sm text-muted text-center mt-2">
          ログインしてスコアを記録すると{"\n"}分析結果が表示されます
        </Text>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!statistics || statistics.totalGames === 0) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <IconSymbol name="chart.bar.fill" size={64} color={colors.muted} />
        <Text className="text-lg font-semibold text-foreground mt-4">データがありません</Text>
        <Text className="text-sm text-muted text-center mt-2">
          スコアを記録すると{"\n"}統計情報が表示されます
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6">
          {/* Header */}
          <Text className="text-2xl font-bold text-foreground mb-6">分析</Text>

          {/* Statistics Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">統計サマリー</Text>

            <View className="gap-3">
              {/* Total Games */}
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-base text-muted">総ゲーム数</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {statistics.totalGames} ゲーム
                </Text>
              </View>

              {/* Average Score */}
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-base text-muted">平均スコア</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {statistics.averageScore} 点
                </Text>
              </View>

              {/* Highest Score */}
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-base text-muted">最高スコア</Text>
                <Text className="text-lg font-semibold text-success">
                  {statistics.highestScore} 点
                </Text>
              </View>

              {/* Lowest Score */}
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-base text-muted">最低スコア</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {statistics.lowestScore} 点
                </Text>
              </View>
            </View>
          </View>

          {/* Strike & Spare Stats */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">ストライク・スペア</Text>

            <View className="gap-3">
              {/* Strike Count */}
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <View className="flex-row items-center">
                  <View className="bg-success px-2 py-1 rounded mr-2">
                    <Text className="text-xs font-bold text-background">X</Text>
                  </View>
                  <Text className="text-base text-muted">ストライク</Text>
                </View>
                <Text className="text-lg font-semibold text-foreground">
                  {statistics.totalStrikes} 回
                </Text>
              </View>

              {/* Strike Rate */}
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <Text className="text-base text-muted ml-8">成功率</Text>
                <Text className="text-lg font-semibold text-success">
                  {statistics.strikeRate.toFixed(1)}%
                </Text>
              </View>

              {/* Spare Count */}
              <View className="flex-row items-center justify-between py-2 border-b border-border">
                <View className="flex-row items-center">
                  <View className="bg-warning px-2 py-1 rounded mr-2">
                    <Text className="text-xs font-bold text-background">/</Text>
                  </View>
                  <Text className="text-base text-muted">スペア</Text>
                </View>
                <Text className="text-lg font-semibold text-foreground">
                  {statistics.totalSpares} 回
                </Text>
              </View>

              {/* Spare Rate */}
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-base text-muted ml-8">成功率</Text>
                <Text className="text-lg font-semibold text-warning">
                  {statistics.spareRate.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* Performance Insights */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-4">パフォーマンス分析</Text>

            <View className="gap-3">
              {/* Strike Performance */}
              <View className="p-3 bg-success/10 rounded-xl">
                <View className="flex-row items-center mb-2">
                  <IconSymbol name="chart.bar.fill" size={20} color={colors.success} />
                  <Text className="text-base font-semibold text-foreground ml-2">
                    ストライク率
                  </Text>
                </View>
                <Text className="text-sm text-muted">
                  {statistics.strikeRate >= 30
                    ? "素晴らしい！ストライク率が高いです"
                    : statistics.strikeRate >= 20
                      ? "良好です。さらなる向上を目指しましょう"
                      : "ストライクを増やすことで大幅にスコアアップできます"}
                </Text>
              </View>

              {/* Spare Performance */}
              <View className="p-3 bg-warning/10 rounded-xl">
                <View className="flex-row items-center mb-2">
                  <IconSymbol name="chart.bar.fill" size={20} color={colors.warning} />
                  <Text className="text-base font-semibold text-foreground ml-2">スペア率</Text>
                </View>
                <Text className="text-sm text-muted">
                  {statistics.spareRate >= 40
                    ? "優秀！スペア処理が得意です"
                    : statistics.spareRate >= 25
                      ? "平均的です。スペア率を上げましょう"
                      : "スペア処理の練習が効果的です"}
                </Text>
              </View>

              {/* Overall Performance */}
              <View className="p-3 bg-primary/10 rounded-xl">
                <View className="flex-row items-center mb-2">
                  <IconSymbol name="chart.bar.fill" size={20} color={colors.primary} />
                  <Text className="text-base font-semibold text-foreground ml-2">総合評価</Text>
                </View>
                <Text className="text-sm text-muted">
                  {statistics.averageScore >= 180
                    ? "エキスパートレベル！素晴らしいスキルです"
                    : statistics.averageScore >= 150
                      ? "上級者レベル。安定したプレーです"
                      : statistics.averageScore >= 120
                        ? "中級者レベル。着実に成長しています"
                        : "初心者レベル。練習を重ねて上達しましょう"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
