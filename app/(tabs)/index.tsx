import { FlatList, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, router]);
  
  const { data: scores, isLoading, refetch } = trpc.scores.list.useQuery(undefined, {
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
        <IconSymbol name="house.fill" size={64} color={colors.muted} />
        <Text className="text-2xl font-bold text-foreground mt-4">ボーリング分析</Text>
        <Text className="text-base text-muted text-center mt-2">
          スコアを記録して分析を始めましょう
        </Text>
        <Text className="text-sm text-muted text-center mt-4">
          ログインしてご利用ください
        </Text>
      </ScreenContainer>
    );
  }

  const handleAddScore = () => {
    router.push("/add-score");
  };

  const handleScorePress = (scoreId: number) => {
    router.push(`/score/${scoreId}` as any);
  };

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center p-6">
      <IconSymbol name="photo" size={64} color={colors.muted} />
      <Text className="text-lg font-semibold text-foreground mt-4">スコアがありません</Text>
      <Text className="text-sm text-muted text-center mt-2">
        「新しいスコアを追加」ボタンをタップして{"\n"}最初のスコアを記録しましょう
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-3 border-b border-border">
          <Text className="text-2xl font-bold text-foreground">スコア一覧</Text>
        </View>

        {/* Score List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={scores}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleScorePress(item.id)}
                className="mx-6 mt-3 bg-surface rounded-2xl p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {item.totalScore} 点
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <IconSymbol name="calendar" size={14} color={colors.muted} />
                      <Text className="text-sm text-muted ml-1">
                        {new Date(item.date).toLocaleDateString("ja-JP")}
                      </Text>
                    </View>
                    {item.location && (
                      <View className="flex-row items-center mt-1">
                        <IconSymbol name="location.fill" size={14} color={colors.muted} />
                        <Text className="text-sm text-muted ml-1">{item.location}</Text>
                      </View>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 100,
            }}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
          />
        )}

        {/* Add Score Button */}
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            onPress={handleAddScore}
            style={{ backgroundColor: colors.primary }}
            className="flex-row items-center justify-center py-4 rounded-full active:opacity-80"
          >
            <IconSymbol name="plus.circle.fill" size={24} color={colors.background} />
            <Text className="text-base font-semibold ml-2" style={{ color: colors.background }}>
              新しいスコアを追加
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
