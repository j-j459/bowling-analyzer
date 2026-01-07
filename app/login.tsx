import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { getLoginUrl } from "@/constants/oauth";
import { Platform } from "react-native";

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, loading, router]);

  const handleLogin = async () => {
    try {
      const loginUrl = getLoginUrl();
      
      if (Platform.OS === "web") {
        // Web: redirect directly
        window.location.href = loginUrl;
      } else {
        // Native: open in browser
        await WebBrowser.openBrowserAsync(loginUrl);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-base text-muted mt-4">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="items-center justify-center p-6">
      <View className="items-center gap-6">
        {/* Logo */}
        <View className="items-center gap-4">
          <IconSymbol name="house.fill" size={80} color={colors.primary} />
          <Text className="text-3xl font-bold text-foreground">ボーリング分析</Text>
          <Text className="text-base text-muted text-center">
            スコアを記録して{"\n"}分析を始めましょう
          </Text>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          style={{ backgroundColor: colors.primary }}
          className="w-full py-4 rounded-full mt-8 active:opacity-80"
        >
          <Text className="text-base font-semibold text-center" style={{ color: colors.background }}>
            ログイン
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <Text className="text-xs text-muted text-center mt-4">
          Manus アカウントでログインして{"\n"}
          ボーリングのスコア分析を始めましょう
        </Text>
      </View>
    </ScreenContainer>
  );
}
