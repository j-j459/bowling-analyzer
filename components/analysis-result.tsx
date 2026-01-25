import React from "react";
import { View, Text } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Frame } from "@/lib/local-scores";

interface AnalysisResultProps {
    frames: Frame[];
    totalScore: number;
}

/**
 * Analysis Result Component
 * Displays detailed analysis with advice for seniors
 */
export function AnalysisResult({ frames, totalScore }: AnalysisResultProps) {
    const colors = useColors();

    // Calculate statistics
    const strikes = frames.filter(f => f.isStrike).length;
    const spares = frames.filter(f => f.isSpare).length;
    const opens = frames.filter(f => !f.isStrike && !f.isSpare).length;

    // Generate advice based on performance
    const generateAdvice = (): { type: "good" | "tip" | "warning"; text: string }[] => {
        const advice: { type: "good" | "tip" | "warning"; text: string }[] = [];

        // Score-based advice
        if (totalScore >= 200) {
            advice.push({ type: "good", text: "素晴らしい！200点超えです！🎉" });
        } else if (totalScore >= 150) {
            advice.push({ type: "good", text: "良いスコアです！安定していますね" });
        } else if (totalScore < 100) {
            advice.push({ type: "tip", text: "1番ピンを狙う練習をしましょう" });
        }

        // Strike advice
        if (strikes >= 5) {
            advice.push({ type: "good", text: `ストライク${strikes}回！調子が良いですね` });
        } else if (strikes <= 1) {
            advice.push({ type: "tip", text: "ストライクを増やすには、1-3番ピンの間を狙いましょう" });
        }

        // Spare advice  
        if (spares >= 5) {
            advice.push({ type: "good", text: "スペア率が高いです！安定した投球ができています" });
        }

        // Open frame advice
        if (opens >= 5) {
            advice.push({ type: "warning", text: "オープンフレームが多いです。スペアを取る練習をしましょう" });
        }

        // Pin-specific advice
        const missedPins = new Map<number, number>();
        frames.forEach(f => {
            if (f.remainingPins) {
                f.remainingPins.forEach(pin => {
                    missedPins.set(pin, (missedPins.get(pin) || 0) + 1);
                });
            }
        });

        // Find worst pin
        let maxMissed = 0;
        let worstPin = 0;
        missedPins.forEach((count, pin) => {
            if (count > maxMissed) {
                maxMissed = count;
                worstPin = pin;
            }
        });

        if (worstPin > 0 && maxMissed >= 2) {
            const pinAdvice: Record<number, string> = {
                7: "7番ピンには、左に板2枚移動して投げましょう",
                10: "10番ピンには、右に板2枚移動して投げましょう",
                4: "4番ピンには、左寄りのアプローチを試しましょう",
                6: "6番ピンには、右寄りのアプローチを試しましょう",
                5: "5番ピンには、真っ直ぐ1番ピン方向に投げましょう",
            };
            advice.push({
                type: "warning",
                text: `${worstPin}番ピンが残りやすいです。${pinAdvice[worstPin] || "立ち位置を調整しましょう"}`
            });
        }

        return advice;
    };

    const adviceItems = generateAdvice();

    return (
        <View className="gap-4">
            {/* Stats Summary */}
            <View className="bg-surface rounded-2xl p-5 border border-border">
                <Text className="text-2xl font-bold text-foreground mb-4">📊 スコア分析</Text>

                <View className="flex-row justify-between mb-4">
                    <View className="items-center flex-1">
                        <Text className="text-4xl font-bold text-primary">{totalScore}</Text>
                        <Text className="text-lg text-muted">合計スコア</Text>
                    </View>
                </View>

                <View className="flex-row justify-around">
                    <View className="items-center">
                        <View className="flex-row items-center">
                            <Text className="text-3xl font-bold text-green-500">{strikes}</Text>
                            <Text className="text-2xl ml-1">🎯</Text>
                        </View>
                        <Text className="text-lg text-muted">ストライク</Text>
                    </View>
                    <View className="items-center">
                        <View className="flex-row items-center">
                            <Text className="text-3xl font-bold text-blue-500">{spares}</Text>
                            <Text className="text-2xl ml-1">✨</Text>
                        </View>
                        <Text className="text-lg text-muted">スペア</Text>
                    </View>
                    <View className="items-center">
                        <View className="flex-row items-center">
                            <Text className="text-3xl font-bold text-gray-500">{opens}</Text>
                            <Text className="text-2xl ml-1">⭕</Text>
                        </View>
                        <Text className="text-lg text-muted">オープン</Text>
                    </View>
                </View>
            </View>

            {/* Advice Section */}
            {adviceItems.length > 0 && (
                <View className="bg-surface rounded-2xl p-5 border border-border">
                    <Text className="text-2xl font-bold text-foreground mb-4">💡 今日のアドバイス</Text>

                    {adviceItems.map((item, idx) => (
                        <View
                            key={idx}
                            className={`p-4 rounded-xl mb-3 ${item.type === "good" ? "bg-green-500/10" :
                                    item.type === "warning" ? "bg-yellow-500/10" :
                                        "bg-blue-500/10"
                                }`}
                        >
                            <Text className={`text-xl font-semibold ${item.type === "good" ? "text-green-600" :
                                    item.type === "warning" ? "text-yellow-600" :
                                        "text-blue-600"
                                }`}>
                                {item.type === "good" ? "✅ " : item.type === "warning" ? "⚠️ " : "💡 "}
                                {item.text}
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Next Goal */}
            <View className="bg-primary/10 rounded-2xl p-5">
                <Text className="text-2xl font-bold text-primary mb-2">🎯 次の目標</Text>
                <Text className="text-xl text-foreground">
                    {totalScore < 100 ? "まずは100点を目指しましょう！" :
                        totalScore < 150 ? "150点を目指して頑張りましょう！" :
                            totalScore < 200 ? "200点の大台に挑戦！" :
                                "素晴らしい！この調子を維持しましょう！"}
                </Text>
            </View>
        </View>
    );
}
