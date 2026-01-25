import { FlatList, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import React, { useState, useCallback } from "react";
import { useRouter, Link, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { getLocalScores, LocalScore } from "@/lib/local-scores";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { loading: authLoading, isGuestMode } = useAuth();

  const [scores, setScores] = useState<LocalScore[]>([]);
  const [loading, setLoading] = useState(false);

  // Load scores from local storage
  const loadScores = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLocalScores();
      setScores(data);
    } catch (error) {
      console.error("Failed to load scores:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadScores();
    }, [loadScores])
  );

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-xl text-muted mt-4">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  const handleAddScore = () => {
    router.push("/add-score");
  };

  const handleScorePress = (scoreId: number) => {
    router.push(`/score/${scoreId}` as any);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-3">
          <Text className="text-3xl font-bold text-foreground">🎳 ボウリング記録</Text>
          <Text className="text-lg text-primary mt-1">
            {isGuestMode ? "オフラインモード" : ""}
          </Text>
        </View>

        {/* Main Camera Button - Hero Section */}
        <View className="px-4 mb-4">
          <TouchableOpacity
            onPress={handleAddScore}
            style={{
              backgroundColor: colors.primary,
              minHeight: 120,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            className="rounded-3xl items-center justify-center active:opacity-80 py-6"
          >
            <IconSymbol name="camera.fill" size={48} color={colors.background} />
            <Text className="text-3xl font-bold mt-3" style={{ color: colors.background }}>
              📷 スコアを撮影
            </Text>
            <Text className="text-lg opacity-90 mt-1" style={{ color: colors.background }}>
              スコアシートをカメラで読み取り
            </Text>
          </TouchableOpacity>
        </View>

        {/* Score History Section */}
        <View className="flex-1 px-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-2xl font-bold text-foreground">📋 記録履歴</Text>
            <Text className="text-lg text-muted">{scores.length}件</Text>
          </View>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : scores.length === 0 ? (
            <View className="flex-1 items-center justify-center p-6">
              <IconSymbol name="photo" size={80} color={colors.muted} />
              <Text className="text-2xl font-bold text-foreground mt-6 text-center">
                まだ記録がありません
              </Text>
              <Text className="text-xl text-muted text-center mt-3">
                上の「スコアを撮影」ボタンで{"\n"}最初の記録を始めましょう！
              </Text>
            </View>
          ) : (
            <FlatList
              data={scores}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleScorePress(item.id)}
                  className="bg-surface rounded-2xl p-5 mb-3 border-2 border-border active:opacity-70"
                  style={{ minHeight: 90 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-3xl font-bold text-foreground">
                        {item.totalScore} 点
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <IconSymbol name="calendar" size={20} color={colors.muted} />
                        <Text className="text-xl text-muted ml-2">
                          {formatDate(item.date)}
                        </Text>
                      </View>
                      {item.location && (
                        <View className="flex-row items-center mt-1">
                          <IconSymbol name="location.fill" size={18} color={colors.muted} />
                          <Text className="text-lg text-muted ml-2">{item.location}</Text>
                        </View>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={28} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={{
                paddingBottom: 20,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={loadScores}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}
