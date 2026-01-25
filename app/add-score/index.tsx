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
import { useAuth } from "@/hooks/use-auth";
import { addLocalScore, Frame } from "@/lib/local-scores";
import { extractScoreFromImage, getQuickAnalysis } from "@/lib/ocr-service";

export default function AddScoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isGuestMode } = useAuth();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [frames, setFrames] = useState<Frame[]>([]);
  const [advice, setAdvice] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick image from library
  const pickImage = async () => {
    try {
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
        await analyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("エラー", "画像の選択に失敗しました");
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
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
        await analyzeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Camera error:", err);
      Alert.alert("エラー", "カメラの起動に失敗しました");
    }
  };

  // Analyze image with OCR
  const analyzeImage = async (uri: string) => {
    setAnalyzing(true);
    setError(null);

    try {
      const result = await extractScoreFromImage(uri);

      if (result.success && result.totalScore !== null) {
        setTotalScore(result.totalScore.toString());
        setFrames(result.frames);
        setAdvice(getQuickAnalysis(result.frames));
      } else {
        setError("スコアを読み取れませんでした。手動で入力してください。");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("画像の分析に失敗しました。手動で入力してください。");
    } finally {
      setAnalyzing(false);
    }
  };

  // Reset and retake
  const handleRetake = () => {
    setImageUri(null);
    setTotalScore("");
    setFrames([]);
    setAdvice([]);
    setError(null);
  };

  // Save score
  const handleSave = async () => {
    const scoreNum = parseInt(totalScore);
    if (!totalScore || isNaN(scoreNum)) {
      setError("スコアを入力してください");
      return;
    }

    if (scoreNum < 0 || scoreNum > 300) {
      setError("スコアは0〜300の範囲で入力してください");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await addLocalScore({
        date,
        location: location || null,
        totalScore: scoreNum,
        gameNumber: 1,
        frames: frames.length > 0 ? frames : generateDefaultFrames(scoreNum),
        imageUrl: imageUri,
      });

      Alert.alert("保存完了", "スコアを保存しました！", [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (err) {
      console.error("Save error:", err);
      setError("保存に失敗しました");
      Alert.alert("エラー", "スコアの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // Generate default frames
  const generateDefaultFrames = (score: number): Frame[] => {
    const frames: Frame[] = [];
    const avgPerFrame = Math.floor(score / 10);
    let remaining = score;

    for (let i = 1; i <= 10; i++) {
      const frameScore = i === 10 ? remaining : Math.min(avgPerFrame, remaining);
      remaining -= frameScore;

      frames.push({
        frameNumber: i,
        firstThrow: Math.min(frameScore, 10),
        secondThrow: frameScore > 10 ? frameScore - 10 : (frameScore < 10 ? 0 : null),
        score: score - remaining,
        isStrike: frameScore >= 10,
        isSpare: false,
        remainingPins: [],
      });
    }
    return frames;
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="p-3">
              <IconSymbol name="chevron.right" size={32} color={colors.foreground} style={{ transform: [{ rotate: "180deg" }] }} />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-foreground ml-2">スコア追加</Text>
          </View>

          {/* Image Capture Section */}
          {!imageUri ? (
            <View className="items-center justify-center bg-surface rounded-3xl p-8 border-2 border-dashed border-primary mb-6">
              <IconSymbol name="camera.fill" size={80} color={colors.primary} />
              <Text className="text-2xl font-bold text-foreground mt-6 text-center">
                スコアシートを撮影
              </Text>
              <Text className="text-lg text-muted text-center mt-2 mb-8">
                写真からスコアを自動読み取りします
              </Text>

              <View className="w-full gap-4">
                <TouchableOpacity
                  onPress={takePhoto}
                  style={{ backgroundColor: colors.primary, minHeight: 70 }}
                  className="flex-row items-center justify-center py-5 rounded-2xl active:opacity-80"
                >
                  <IconSymbol name="camera.fill" size={32} color={colors.background} />
                  <Text className="text-2xl font-bold ml-3" style={{ color: colors.background }}>
                    📷 カメラで撮影
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  style={{ borderColor: colors.primary, borderWidth: 3, minHeight: 70 }}
                  className="flex-row items-center justify-center py-5 rounded-2xl active:opacity-80"
                >
                  <IconSymbol name="photo" size={32} color={colors.primary} />
                  <Text className="text-2xl font-bold ml-3" style={{ color: colors.primary }}>
                    🖼️ 画像を選択
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="mb-4">
              {/* Image Preview */}
              <View className="bg-surface rounded-2xl overflow-hidden border-2 border-border mb-4">
                <Image source={{ uri: imageUri }} style={{ width: "100%", height: 200 }} contentFit="contain" />
              </View>

              {/* Analyzing Indicator */}
              {analyzing && (
                <View className="items-center py-8 bg-surface rounded-2xl mb-4">
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text className="text-xl font-bold text-foreground mt-4">
                    📊 スコアを分析中...
                  </Text>
                </View>
              )}

              {/* Analysis Result */}
              {!analyzing && (
                <View className="gap-4">
                  {/* Error Display */}
                  {error && (
                    <View className="bg-destructive/10 rounded-xl p-4">
                      <Text className="text-lg text-destructive font-semibold">{error}</Text>
                    </View>
                  )}

                  {/* Advice Section */}
                  {advice.length > 0 && (
                    <View className="bg-primary/10 rounded-2xl p-5">
                      <Text className="text-xl font-bold text-primary mb-3">💡 今日のアドバイス</Text>
                      {advice.map((item, idx) => (
                        <Text key={idx} className="text-lg text-foreground mb-2">{item}</Text>
                      ))}
                    </View>
                  )}

                  {/* Form Fields */}
                  <View className="bg-surface rounded-2xl p-5 border border-border gap-5">
                    {/* Date */}
                    <View>
                      <Text className="text-xl font-bold text-foreground mb-2">📅 日付</Text>
                      <TextInput
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        className="bg-background border-2 border-border rounded-xl px-4 py-4 text-xl text-foreground"
                        placeholderTextColor={colors.muted}
                      />
                    </View>

                    {/* Location */}
                    <View>
                      <Text className="text-xl font-bold text-foreground mb-2">📍 場所</Text>
                      <TextInput
                        value={location}
                        onChangeText={setLocation}
                        placeholder="ボーリング場名（任意）"
                        className="bg-background border-2 border-border rounded-xl px-4 py-4 text-xl text-foreground"
                        placeholderTextColor={colors.muted}
                      />
                    </View>

                    {/* Score */}
                    <View>
                      <Text className="text-xl font-bold text-foreground mb-2">🎳 合計スコア</Text>
                      <TextInput
                        value={totalScore}
                        onChangeText={(text) => {
                          setTotalScore(text);
                          setError(null);
                        }}
                        placeholder="0〜300"
                        keyboardType="number-pad"
                        className="bg-background border-2 border-border rounded-xl px-4 py-5 text-3xl font-bold text-foreground text-center"
                        placeholderTextColor={colors.muted}
                        maxLength={3}
                      />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <TouchableOpacity
                    onPress={handleSave}
                    style={{ backgroundColor: colors.primary, minHeight: 70 }}
                    className="py-5 rounded-2xl active:opacity-80"
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color={colors.background} size="large" />
                    ) : (
                      <Text className="text-2xl font-bold text-center" style={{ color: colors.background }}>
                        💾 保存する
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRetake}
                    style={{ borderColor: colors.border, borderWidth: 2, minHeight: 60 }}
                    className="py-4 rounded-2xl active:opacity-70"
                  >
                    <Text className="text-xl font-semibold text-center text-muted">
                      🔄 撮り直す
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Manual Entry Option (when no image) */}
          {!imageUri && (
            <View className="mt-4">
              <Text className="text-lg text-muted text-center mb-4">または</Text>
              <TouchableOpacity
                onPress={() => setImageUri("manual")}
                style={{ borderColor: colors.muted, borderWidth: 1 }}
                className="py-4 rounded-2xl active:opacity-70"
              >
                <Text className="text-xl font-semibold text-center text-muted">
                  ✏️ 手動でスコアを入力
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Manual Entry Form (for "manual" mode) */}
          {imageUri === "manual" && (
            <View className="gap-4">
              <View className="bg-surface rounded-2xl p-5 border border-border gap-5">
                <View>
                  <Text className="text-xl font-bold text-foreground mb-2">📅 日付</Text>
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                    className="bg-background border-2 border-border rounded-xl px-4 py-4 text-xl text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View>
                  <Text className="text-xl font-bold text-foreground mb-2">📍 場所</Text>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="ボーリング場名（任意）"
                    className="bg-background border-2 border-border rounded-xl px-4 py-4 text-xl text-foreground"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View>
                  <Text className="text-xl font-bold text-foreground mb-2">🎳 合計スコア</Text>
                  <TextInput
                    value={totalScore}
                    onChangeText={setTotalScore}
                    placeholder="0〜300"
                    keyboardType="number-pad"
                    className="bg-background border-2 border-border rounded-xl px-4 py-5 text-3xl font-bold text-foreground text-center"
                    placeholderTextColor={colors.muted}
                    maxLength={3}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSave}
                style={{ backgroundColor: colors.primary, minHeight: 70 }}
                className="py-5 rounded-2xl active:opacity-80"
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} size="large" />
                ) : (
                  <Text className="text-2xl font-bold text-center" style={{ color: colors.background }}>
                    💾 保存する
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRetake}
                style={{ borderColor: colors.border, borderWidth: 2 }}
                className="py-4 rounded-2xl active:opacity-70"
              >
                <Text className="text-xl font-semibold text-center text-muted">
                  ← 戻る
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
