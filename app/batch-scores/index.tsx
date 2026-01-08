import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { Image } from "expo-image";

interface ScorePreview {
  playerName?: string;
  totalScore: number;
  frameCount: number;
  selected: boolean;
}

export default function BatchScoresScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scores, setScores] = useState<ScorePreview[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const uploadImageMutation = trpc.scores.uploadImage.useMutation();
  const analyzeMultipleMutation = trpc.scores.analyzeMultipleScores.useMutation();
  const createScoreMutation = trpc.scores.create.useMutation();
  const utils = trpc.useUtils();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      analyzeImage(asset.uri);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    try {
      setIsAnalyzing(true);

      // Upload image to S3
      const base64 = await convertImageToBase64(imageUri);
      const uploadResult = await uploadImageMutation.mutateAsync({
        base64Data: base64,
        fileName: `batch-${Date.now()}.jpg`,
      });

      // Analyze multiple scores
      const analysisResult = await analyzeMultipleMutation.mutateAsync({
        imageUrl: uploadResult.url,
      });

      // Convert to preview format
      const previews: ScorePreview[] = analysisResult.scores.map((score) => ({
        playerName: score.playerName,
        totalScore: score.totalScore,
        frameCount: score.frames.length,
        selected: true,
      }));

      setScores(previews);
    } catch (error) {
      Alert.alert("エラー", "画像の分析に失敗しました");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  };

  const toggleScoreSelection = (index: number) => {
    setScores((prev) =>
      prev.map((score, i) =>
        i === index ? { ...score, selected: !score.selected } : score
      )
    );
  };

  const handleSaveScores = async () => {
    const selectedScores = scores.filter((s) => s.selected);

    if (selectedScores.length === 0) {
      Alert.alert("エラー", "保存するスコアを選択してください");
      return;
    }

    try {
      setIsAnalyzing(true);

      // Save each selected score
      for (const score of selectedScores) {
        await createScoreMutation.mutateAsync({
          date: new Date(),
          totalScore: score.totalScore,
          frames: [], // Frames would be populated from the full analysis
          gameNumber: 1,
        });
      }

      // Invalidate and refresh
      await utils.scores.list.invalidate();

      Alert.alert(
        "成功",
        `${selectedScores.length}個のスコアを保存しました`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("エラー", "スコアの保存に失敗しました");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-6">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">
              複数スコア一括登録
            </Text>
            <Text className="text-sm text-muted">
              1枚の写真から複数のスコアを自動認識します
            </Text>
          </View>

          {/* Image Selection */}
          {!selectedImage ? (
            <TouchableOpacity
              onPress={pickImage}
              disabled={isAnalyzing}
              className="border-2 border-dashed border-primary rounded-xl p-8 items-center justify-center"
              style={{ borderColor: colors.primary }}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <>
                  <Text className="text-4xl mb-2">📸</Text>
                  <Text className="text-base font-semibold text-foreground">
                    画像を選択
                  </Text>
                  <Text className="text-sm text-muted mt-1">
                    ボーリング場のスコア表の写真を選択してください
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <>
              {/* Selected Image */}
              <View className="bg-surface rounded-lg overflow-hidden border border-border">
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: 250 }}
                  contentFit="contain"
                />
              </View>

              {/* Change Image Button */}
              <TouchableOpacity
                onPress={pickImage}
                disabled={isAnalyzing}
                className="bg-surface py-2 rounded-lg active:opacity-80"
                style={{ borderColor: colors.border, borderWidth: 1 }}
              >
                <Text className="text-center font-semibold text-foreground">
                  別の画像を選択
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Scores List */}
          {scores.length > 0 && (
            <View
              className="bg-surface rounded-lg p-4 gap-3"
              style={{ borderColor: colors.border, borderWidth: 1 }}
            >
              <Text className="text-lg font-semibold text-foreground">
                認識されたスコア ({scores.length}件)
              </Text>

              <FlatList
                scrollEnabled={false}
                data={scores}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => toggleScoreSelection(index)}
                    className="flex-row items-center gap-3 p-3 rounded-lg mb-2"
                    style={{
                      backgroundColor: item.selected
                        ? colors.primary + "20"
                        : colors.background,
                      borderColor: item.selected ? colors.primary : colors.border,
                      borderWidth: 1,
                    }}
                  >
                    <View
                      className="w-6 h-6 rounded border-2 items-center justify-center"
                      style={{
                        borderColor: item.selected ? colors.primary : colors.border,
                        backgroundColor: item.selected ? colors.primary : "transparent",
                      }}
                    >
                      {item.selected && (
                        <Text className="text-white font-bold">✓</Text>
                      )}
                    </View>

                    <View className="flex-1">
                      {item.playerName && (
                        <Text className="text-sm font-semibold text-foreground">
                          {item.playerName}
                        </Text>
                      )}
                      <Text className="text-lg font-bold text-primary">
                        {item.totalScore} 点
                      </Text>
                      <Text className="text-xs text-muted">
                        {item.frameCount} フレーム
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Save Button */}
          {scores.length > 0 && (
            <TouchableOpacity
              onPress={handleSaveScores}
              disabled={isAnalyzing || scores.every((s) => !s.selected)}
              className="bg-primary py-4 rounded-xl active:opacity-80"
              style={{
                opacity:
                  isAnalyzing || scores.every((s) => !s.selected) ? 0.5 : 1,
              }}
            >
              {isAnalyzing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-center font-semibold text-background text-base">
                  💾 選択したスコアを保存
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
