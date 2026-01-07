import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AddScoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [recognizedData, setRecognizedData] = useState<any>(null);

  const uploadMutation = trpc.scores.uploadImage.useMutation();
  const analyzeMutation = trpc.scores.analyzeImage.useMutation();
  const createMutation = trpc.scores.create.useMutation();

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("権限エラー", "写真ライブラリへのアクセスが必要です");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("権限エラー", "カメラへのアクセスが必要です");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const analyzeImage = async (uri: string) => {
    try {
      setAnalyzing(true);

      // Convert image to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        // Upload to S3
        const uploadResult = await uploadMutation.mutateAsync({
          base64Data,
          fileName: `score-${Date.now()}.jpg`,
        });

        // Analyze with AI
        const analysisResult = await analyzeMutation.mutateAsync({
          imageUrl: uploadResult.url,
        });

        setRecognizedData(analysisResult);
        setTotalScore(analysisResult.totalScore?.toString() || "");
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Analysis error:", error);
      Alert.alert("エラー", "画像の分析に失敗しました。手動で入力してください。");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!totalScore || !recognizedData?.frames) {
      Alert.alert("エラー", "スコアデータが不足しています");
      return;
    }

    try {
      await createMutation.mutateAsync({
        imageUrl: recognizedData.imageUrl,
        date: new Date(date),
        location: location || undefined,
        totalScore: parseInt(totalScore),
        gameNumber: 1,
        frames: recognizedData.frames,
      });

      Alert.alert("成功", "スコアを保存しました", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("エラー", "スコアの保存に失敗しました");
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <IconSymbol name="chevron.right" size={24} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground">スコア追加</Text>
          </View>

          {/* Image Picker */}
          {!imageUri ? (
            <View className="items-center justify-center bg-surface rounded-2xl p-8 border-2 border-dashed border-border">
              <IconSymbol name="camera.fill" size={48} color={colors.muted} />
              <Text className="text-base text-muted mt-4 mb-6">スコア表の写真を撮影または選択</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={takePhoto}
                  style={{ backgroundColor: colors.primary }}
                  className="px-6 py-3 rounded-full active:opacity-80"
                >
                  <Text className="text-base font-semibold" style={{ color: colors.background }}>
                    撮影
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickImage}
                  className="px-6 py-3 rounded-full border-2 active:opacity-70"
                  style={{ borderColor: colors.primary }}
                >
                  <Text className="text-base font-semibold" style={{ color: colors.primary }}>
                    選択
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {/* Image Preview */}
              <View className="bg-surface rounded-2xl overflow-hidden border border-border mb-4">
                <Image source={{ uri: imageUri }} style={{ width: "100%", height: 200 }} contentFit="contain" />
              </View>

              {analyzing && (
                <View className="items-center py-6">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text className="text-base text-muted mt-3">AI が画像を分析中...</Text>
                </View>
              )}

              {!analyzing && recognizedData && (
                <View className="gap-4">
                  {/* Date Input */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">日付</Text>
                    <TextInput
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                      placeholderTextColor={colors.muted}
                    />
                  </View>

                  {/* Location Input */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">場所（任意）</Text>
                    <TextInput
                      value={location}
                      onChangeText={setLocation}
                      placeholder="ボーリング場名"
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                      placeholderTextColor={colors.muted}
                    />
                  </View>

                  {/* Total Score Input */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">合計スコア</Text>
                    <TextInput
                      value={totalScore}
                      onChangeText={setTotalScore}
                      placeholder="0"
                      keyboardType="number-pad"
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                      placeholderTextColor={colors.muted}
                    />
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSave}
                    style={{ backgroundColor: colors.primary }}
                    className="py-4 rounded-full mt-4 active:opacity-80"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <ActivityIndicator color={colors.background} />
                    ) : (
                      <Text className="text-base font-semibold text-center" style={{ color: colors.background }}>
                        保存
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Retake Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setImageUri(null);
                      setRecognizedData(null);
                      setTotalScore("");
                    }}
                    className="py-3 rounded-full border-2 active:opacity-70"
                    style={{ borderColor: colors.border }}
                  >
                    <Text className="text-base font-semibold text-center text-muted">再撮影</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
