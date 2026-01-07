import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function SettingsScreen() {
  const colors = useColors();
  const { user, isAuthenticated, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    Alert.alert("ログアウト", "ログアウトしますか?", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          try {
            await logoutMutation.mutateAsync();
            logout();
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6">
          {/* Header */}
          <Text className="text-2xl font-bold text-foreground mb-6">設定</Text>

          {/* User Info Section */}
          {isAuthenticated && user ? (
            <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
              <Text className="text-lg font-bold text-foreground mb-3">アカウント情報</Text>

              <View className="gap-2">
                {user.name && (
                  <View className="flex-row items-center py-2">
                    <Text className="text-base text-muted w-20">名前</Text>
                    <Text className="text-base text-foreground flex-1">{user.name}</Text>
                  </View>
                )}

                {user.email && (
                  <View className="flex-row items-center py-2">
                    <Text className="text-base text-muted w-20">メール</Text>
                    <Text className="text-base text-foreground flex-1">{user.email}</Text>
                  </View>
                )}

                <View className="flex-row items-center py-2">
                  <Text className="text-base text-muted w-20">ログイン</Text>
                  <Text className="text-base text-foreground flex-1">{user.loginMethod}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                className="mt-4 py-3 rounded-xl border-2 active:opacity-70"
                style={{ borderColor: colors.error }}
              >
                <Text className="text-base font-semibold text-center" style={{ color: colors.error }}>
                  ログアウト
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
              <Text className="text-base text-muted text-center">ログインしていません</Text>
            </View>
          )}

          {/* App Info Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">アプリ情報</Text>

            <View className="gap-2">
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-base text-muted">バージョン</Text>
                <Text className="text-base text-foreground">1.0.0</Text>
              </View>

              <View className="flex-row items-center justify-between py-2">
                <Text className="text-base text-muted">アプリ名</Text>
                <Text className="text-base text-foreground">ボーリング分析</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View className="mt-6 p-4">
            <Text className="text-sm text-muted text-center leading-relaxed">
              ボーリングのスコアを記録・分析して{"\n"}
              上達をサポートするアプリです
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
