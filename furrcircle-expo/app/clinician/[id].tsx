import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Avatar,
  Badge,
  Button,
  GlassCard,
  IconButton,
  IconTile,
  ListRow,
  Screen,
  ScreenHeader,
  ScreenScroll,
  SectionHeader,
  Segmented,
  StatRow,
  Text,
  VerifiedMark,
} from "../../src/components/ui";
import { clinicById, vetById } from "../../src/data/mock";
import { radius, spacing, useTheme } from "../../src/theme";

const SERVICES = [
  { icon: "medical", label: "Routine visit", fee: "₹800" },
  { icon: "shield-checkmark", label: "Vaccination", fee: "₹600" },
  { icon: "bandage", label: "Dermatology", fee: "₹1,000" },
  { icon: "nutrition", label: "Nutrition plan", fee: "₹700" },
  { icon: "happy", label: "Behaviour", fee: "₹900" },
] as const;

const REVIEWS = [
  { by: "Divya S.", rating: 5, ago: "2 weeks ago", text: "Explained the whole allergy plan without rushing. Milo's coat is finally settling." },
  { by: "Karthik R.", rating: 5, ago: "1 month ago", text: "Video consult saved us a stressful car ride. Follow-up notes arrived the same evening." },
  { by: "Fatima N.", rating: 4, ago: "2 months ago", text: "Great with a nervous cat. Clinic runs a little behind schedule in the evenings." },
];

export default function ClinicianProfile() {
  const { tk } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<"services" | "about" | "reviews">("services");

  const vet = vetById(id ?? "v_1") ?? vetById("v_1")!;
  const clinic = clinicById(vet.clinicId)!;

  return (
    <Screen>
      <ScreenHeader
        title=""
        back
        size="compact"
        right={
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <IconButton icon="bookmark-outline" accessibilityLabel="Save" onPress={() => {}} />
            <IconButton icon="share-outline" accessibilityLabel="Share" onPress={() => {}} />
          </View>
        }
      />

      <ScreenScroll style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 0 }}>
        <GlassCard shadow="lg" style={{ alignItems: "center", padding: spacing.xl }}>
          <Avatar uri={vet.photo} name={vet.name} size={92} ring={vet.verified ? "verified" : "brand"} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md }}>
            <Text variant="heading">{vet.name}</Text>
            {vet.verified ? <VerifiedMark size={17} /> : null}
          </View>
          <Text variant="caption" tone="secondary">
            {vet.speciality} · {vet.qualifications}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
            {vet.verified ? <Badge label="FurrCircle verified" tone="verified" icon="shield-checkmark" /> : null}
            {vet.availableNow ? <Badge label="Available now" tone="success" icon="ellipse" /> : null}
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <StatRow
              stats={[
                { label: "Rating", value: String(vet.rating) },
                { label: "Reviews", value: String(vet.reviews) },
                { label: "Years", value: String(vet.yearsExperience) },
              ]}
            />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, alignSelf: "stretch" }}>
            <Button label="Book consultation" style={{ flex: 1 }} size="lg" onPress={() => router.push(`/book/${vet.id}`)} />
            <IconButton icon="heart-outline" size={56} accessibilityLabel="Follow clinic" onPress={() => {}} />
          </View>
        </GlassCard>

        <Segmented
          style={{ marginTop: spacing.lg }}
          value={tab}
          onChange={setTab}
          options={[
            { value: "services", label: "Services" },
            { value: "about", label: "About" },
            { value: "reviews", label: "Reviews" },
          ]}
        />

        {tab === "services" ? (
          <>
            <SectionHeader title="Consultation types" />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              {vet.consultTypes.map((t) => (
                <GlassCard key={t} style={{ flex: 1, alignItems: "center", gap: 6, paddingVertical: spacing.lg }} shadow="sm">
                  <IconTile
                    icon={t === "in-clinic" ? "business" : t === "video" ? "videocam" : "call"}
                    tone={t === "in-clinic" ? "primary" : "verified"}
                    size={38}
                  />
                  <Text variant="caption" style={{ fontWeight: "700" }}>
                    {t === "in-clinic" ? "In-clinic" : t === "video" ? "Video" : "Voice"}
                  </Text>
                  <Text variant="micro" tone="muted">
                    {t === "in-clinic" ? "20 MIN" : "15 MIN"}
                  </Text>
                </GlassCard>
              ))}
            </View>

            <SectionHeader title="Services and fees" />
            <GlassCard padded={false} style={{ paddingVertical: spacing.xs }}>
              {SERVICES.map((s, i) => (
                <View key={s.label}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md }}>
                    <IconTile icon={s.icon} tone="primary" size={36} />
                    <Text variant="body" style={{ flex: 1 }}>
                      {s.label}
                    </Text>
                    <Text variant="bodyStrong">{s.fee}</Text>
                  </View>
                  {i < SERVICES.length - 1 ? (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginLeft: 62 }} />
                  ) : null}
                </View>
              ))}
            </GlassCard>

            <SectionHeader title="Next available" />
            <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <IconTile icon="time" tone="success" size={42} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                  {vet.nextSlot}
                </Text>
                <Text variant="caption" tone="secondary">
                  From ₹{vet.feeFrom} · {vet.distanceKm} km away
                </Text>
              </View>
              <Button label="Book" size="sm" onPress={() => router.push(`/book/${vet.id}`)} />
            </GlassCard>
          </>
        ) : null}

        {tab === "about" ? (
          <>
            <SectionHeader title="About" />
            <GlassCard>
              <Text variant="body" tone="secondary">
                {vet.bio}
              </Text>
              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />
              <Detail label="Languages" value={vet.languages.join(", ")} />
              <Detail label="Species treated" value={vet.species.join(", ")} />
              <Detail label="Qualifications" value={vet.qualifications} />
              <Detail label="Experience" value={`${vet.yearsExperience} years`} />
            </GlassCard>

            <SectionHeader title="Clinic" />
            <GlassCard>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <IconTile icon="business" tone="primary" size={44} />
                <View style={{ flex: 1 }}>
                  <Text variant="subheading">{clinic.name}</Text>
                  <Text variant="caption" tone="secondary">
                    {clinic.address}, {clinic.city}
                  </Text>
                </View>
                <IconButton icon="navigate" accessibilityLabel="Directions" onPress={() => {}} />
              </View>

              <View
                style={{
                  marginTop: spacing.lg,
                  height: 120,
                  borderRadius: radius.md,
                  backgroundColor: tk.primarySoft,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Ionicons name="map" size={26} color={tk.primary} />
                <Text variant="caption" tone="primary">
                  {clinic.distanceKm} km · about 9 min drive
                </Text>
              </View>

              <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: tk.separator, marginVertical: spacing.lg }} />
              <Detail label="Hours" value={clinic.hours} />
              <Detail label="Emergency" value={clinic.emergency ? "Available" : "Not available"} />
              <Detail label="Facilities" value={clinic.facilities.join(" · ")} />
            </GlassCard>

            <SectionHeader title="Education from this clinic" />
            <View style={{ gap: spacing.sm }}>
              <ListRow icon="rainy" tone="verified" title="Monsoon skin care for dogs" subtitle="Educational post · not a diagnosis" onPress={() => {}} />
              <ListRow icon="shield-checkmark" tone="verified" title="Answered: shedding in September" subtitle="Verified vet answer in Community" onPress={() => {}} />
            </View>
          </>
        ) : null}

        {tab === "reviews" ? (
          <>
            <SectionHeader title={`${vet.reviews} reviews`} />
            <GlassCard style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
              <View style={{ alignItems: "center" }}>
                <Text variant="display">{vet.rating}</Text>
                <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons key={n} name={n <= Math.round(vet.rating) ? "star" : "star-outline"} size={12} color={tk.warning} />
                  ))}
                </View>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <View key={n} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Text variant="micro" tone="muted" style={{ width: 8 }}>
                      {n}
                    </Text>
                    <View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: tk.separator, overflow: "hidden" }}>
                      <View
                        style={{
                          width: `${n === 5 ? 86 : n === 4 ? 11 : n === 3 ? 2 : 1}%`,
                          height: "100%",
                          backgroundColor: tk.warning,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </GlassCard>

            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              {REVIEWS.map((r) => (
                <GlassCard key={r.by}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                    <Avatar name={r.by} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={{ fontWeight: "700" }}>
                        {r.by}
                      </Text>
                      <Text variant="micro" tone="muted">
                        {r.ago.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons key={n} name={n <= r.rating ? "star" : "star-outline"} size={11} color={tk.warning} />
                      ))}
                    </View>
                  </View>
                  <Text variant="caption" tone="secondary" style={{ marginTop: spacing.md }}>
                    {r.text}
                  </Text>
                </GlassCard>
              ))}
            </View>

            <Text variant="micro" tone="muted" center style={{ marginTop: spacing.lg }}>
              REVIEWS COME ONLY FROM COMPLETED APPOINTMENTS
            </Text>
          </>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: spacing.sm }}>
      <Text variant="caption" tone="muted" style={{ width: 110 }}>
        {label}
      </Text>
      <Text variant="caption" style={{ flex: 1, textTransform: "capitalize" }}>
        {value}
      </Text>
    </View>
  );
}
