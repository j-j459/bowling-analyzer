import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ScoreDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scoreId = parseInt(id as string);

  const { data: score, isLoading } = trpc.scores.get.useQuery({ id: scoreId });
  const deleteMutation = trpc.scores.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = () => {
    Alert.alert("削除確認", "このスコアを削除しますか?", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: scoreId });
            utils.scores.list.invalidate();
            router.back();
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (!score) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-lg text-muted">スコアが見つかりません</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity onPress={() => router.back()} className="mr-4">
                <IconSymbol
                  name="chevron.right"
                  size={24}
                  color={colors.foreground}
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-foreground">スコア詳細</Text>
            </View>
            <TouchableOpacity onPress={handleDelete} className="active:opacity-70">
              <IconSymbol name="trash.fill" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View className="p-6 gap-4">
            {/* Score Image */}
            {score.imageUrl && (
              <View className="bg-surface rounded-2xl overflow-hidden border border-border">
                <Image
                  source={{ uri: score.imageUrl }}
                  style={{ width: "100%", height: 250 }}
                  contentFit="contain"
                />
              </View>
            )}

            {/* Basic Info Card */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-3xl font-bold text-foreground mb-3">{score.totalScore} 点</Text>

              <View className="flex-row items-center mb-2">
                <IconSymbol name="calendar" size={16} color={colors.muted} />
                <Text className="text-base text-muted ml-2">
                  {new Date(score.date).toLocaleDateString("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>

              {score.location && (
                <View className="flex-row items-center">
                  <IconSymbol name="location.fill" size={16} color={colors.muted} />
                  <Text className="text-base text-muted ml-2">{score.location}</Text>
                </View>
              )}
            </View>

            {/* Frames Detail */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-lg font-bold text-foreground mb-3">フレーム詳細</Text>

              <View className="gap-2">
                {score.frames.map((frame) => (
                  <View
                    key={frame.frameNumber}
                    className="flex-row items-center justify-between py-2 border-b border-border"
                  >
                    <View className="flex-row items-center flex-1">
                      <Text className="text-base font-semibold text-foreground w-16">
                        {frame.frameNumber}F
                      </Text>
                      <View className="flex-row items-center gap-2">
                        {frame.isStrike && (
                          <View className="bg-success px-2 py-1 rounded">
                            <Text className="text-xs font-bold text-background">X</Text>
                          </View>
                        )}
                        {frame.isSpare && (
                          <View className="bg-warning px-2 py-1 rounded">
                            <Text className="text-xs font-bold text-background">/</Text>
                          </View>
                        )}
                        {!frame.isStrike && !frame.isSpare && (
                          <Text className="text-sm text-muted">
                            {frame.firstThrow ?? "-"} + {frame.secondThrow ?? "-"}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className="text-base font-semibold text-foreground">{frame.score}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Analysis Button */}
            <Link href={`/analysis/${score.id}`} asChild>
              <TouchableOpacity className="bg-primary py-4 rounded-xl active:opacity-80">
                <Text className="text-center font-semibold text-background text-base">
                  📊 詳細分析を見る
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
