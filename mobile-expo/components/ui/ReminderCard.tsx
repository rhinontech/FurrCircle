import React from "react";
import { View } from "react-native";
import { AppText as Text } from "@/components/ui/AppText";

interface ReminderCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  variant: "warning" | "info" | "danger";
}

export default function ReminderCard({ icon, title, subtitle, variant }: ReminderCardProps) {
  const styles = {
    warning: "bg-amber-50 border-amber-200/50",
    info: "bg-sky-50 border-sky-200/50",
    danger: "bg-rose-50 border-rose-200/50"
  };

  const iconWrapStyles = {
    warning: "text-amber-500",
    info: "text-sky-500",
    danger: "text-rose-500"
  };

  return (
    <View className={`w-40 rounded-2xl border p-3.5 mr-3 ${styles[variant]}`}>
      <View className={`mb-2 ${iconWrapStyles[variant]}`}>
        {icon}
      </View>
      <Text className="text-sm font-semibold text-slate-950">{title}</Text>
      <Text className="text-xs text-slate-500 mt-0.5">{subtitle}</Text>
    </View>
  );
}
