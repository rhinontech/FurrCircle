import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";

export default function StatusChip({ label, variant }: { label: string; variant: "success" | "warning" | "danger" | "info" }) {
  const styles = {
    success: "bg-emerald-100 border-emerald-200",
    warning: "bg-amber-100 border-amber-200",
    danger: "bg-rose-100 border-rose-200",
    info: "bg-sky-100 border-sky-200",
  };
  const textStyles = {
    success: "text-emerald-800",
    warning: "text-amber-800",
    danger: "text-rose-800",
    info: "text-sky-800",
  };

  return (
    <View className={`px-2 py-0.5 rounded-full border ${styles[variant]} flex items-center justify-center`}>
      <Text className={`text-xs font-medium ${textStyles[variant]}`}>{label}</Text>
    </View>
  );
}
