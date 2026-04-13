import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, Share2, Download, ShieldCheck, PawPrint, Syringe, Building2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { userPetsApi } from "@/services/users/petsApi";
import { userHealthApi } from "@/services/users/healthApi";

const CERT_BLUE = "#0f2557";
const CERT_ACCENT = "#3b82f6";

// ─── Certificate HTML (for PDF generation) ─────────────────────────────────
const buildCertificateHtml = (data: {
  petName: string; species: string; breed: string; age: string; ownerName: string;
  vaccineName: string; batchNo: string; dateAdministered: string; nextDueDate: string;
  vetName: string; clinicName: string; licenseNumber: string; clinicAddress: string;
  clinicLogoUrl: string | null;
}) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; background: #fff; }
  .page { padding: 32px; max-width: 680px; margin: 0 auto; }
  .card { border: 2.5px solid #0f2557; border-radius: 16px; padding: 28px; position: relative; }
  .corner { position: absolute; width: 52px; height: 52px; }
  .tl { top: 0; left: 0; border-top: 4px solid #1e3a8a; border-left: 4px solid #1e3a8a; border-radius: 12px 0 0 0; }
  .tr { top: 0; right: 0; border-top: 4px solid #1e3a8a; border-right: 4px solid #1e3a8a; border-radius: 0 12px 0 0; }
  .bl { bottom: 0; left: 0; border-bottom: 4px solid #1e3a8a; border-left: 4px solid #1e3a8a; border-radius: 0 0 0 12px; }
  .br { bottom: 0; right: 0; border-bottom: 4px solid #1e3a8a; border-right: 4px solid #1e3a8a; border-radius: 0 0 12px 0; }
  .header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .logo-box { width: 52px; height: 52px; border-radius: 10px; background: #eff6ff; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .logo-box img { width: 100%; height: 100%; object-fit: contain; }
  .logo-text { font-size: 11px; font-weight: 800; color: #0f2557; text-align: center; line-height: 1.2; }
  .title-center { text-align: center; flex: 1; margin: 0 12px; }
  .cert-title { font-size: 18px; font-weight: 800; color: #0f2557; letter-spacing: 1px; }
  .cert-subtitle { font-size: 9px; color: #64748b; letter-spacing: 2px; margin-top: 3px; }
  .divider { height: 3px; background: linear-gradient(90deg, #0f2557, #3b82f6, #0f2557); border-radius: 2px; margin-bottom: 16px; }
  .clinic-block { background: #f0f4ff; border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 16px; }
  .clinic-name { font-size: 15px; font-weight: 700; color: #0f2557; }
  .clinic-sub { font-size: 10px; color: #64748b; margin-top: 3px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
  .info-box { background: #f8fafc; border-radius: 10px; padding: 12px; }
  .info-title { font-size: 9px; font-weight: 700; color: #0f2557; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .field { margin-bottom: 6px; }
  .field-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .field-value { font-size: 12px; font-weight: 600; color: #1e293b; margin-top: 1px; }
  .vaccine-block { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 10px; padding: 14px; margin-bottom: 18px; }
  .vaccine-title { font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .vaccine-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .signature-row { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px dashed #cbd5e1; margin-top: 4px; }
  .sig-label { font-size: 9px; color: #94a3b8; }
  .sig-name { font-size: 13px; font-weight: 700; color: #0f2557; font-style: italic; margin-top: 4px; }
  .sig-line { width: 140px; border-bottom: 1px solid #0f2557; margin-top: 22px; }
  .sig-hint { font-size: 8px; color: #94a3b8; margin-top: 3px; }
  .brand-right { text-align: right; }
  .brand-issued { font-size: 8px; color: #94a3b8; }
  .brand-name { font-size: 13px; font-weight: 700; color: #0f2557; margin-top: 2px; }
  .brand-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
  .brand-rn { font-size: 8px; color: #94a3b8; margin-top: 1px; }
  .disclaimer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 8px; color: #94a3b8; text-align: center; line-height: 1.5; }
</style>
</head>
<body>
<div class="page">
  <div class="card">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="header-row">
      <!-- FurrCircle logo (left) -->
      <div class="logo-box" style="background:#eff6ff;">
        <span class="logo-text">Furr<br/>Circle</span>
      </div>
      <div class="title-center">
        <div class="cert-title">VACCINATION CERTIFICATE</div>
        <div class="cert-subtitle">OFFICIAL PET HEALTH RECORD</div>
      </div>
      <!-- Clinic logo (right) -->
      <div class="logo-box" style="background:#f1f5f9;">
        ${data.clinicLogoUrl
          ? `<img src="${data.clinicLogoUrl}" alt="Clinic Logo" />`
          : `<span style="font-size:10px;color:#64748b;text-align:center;">Clinic<br/>Logo</span>`}
      </div>
    </div>

    <div class="divider"></div>

    <!-- Clinic info -->
    <div class="clinic-block">
      <div class="clinic-name">${data.clinicName || "Veterinary Clinic"}</div>
      ${data.clinicAddress ? `<div class="clinic-sub">${data.clinicAddress}</div>` : ""}
      ${data.licenseNumber ? `<div class="clinic-sub">License No: ${data.licenseNumber}</div>` : ""}
    </div>

    <!-- Pet + Owner info -->
    <div class="two-col">
      <div class="info-box">
        <div class="info-title">Pet Information</div>
        ${[
          ["Name", data.petName],
          ["Species", data.species],
          ["Breed", data.breed],
          ["Age", data.age],
        ].filter(([, v]) => v).map(([l, v]) => `
          <div class="field">
            <div class="field-label">${l}</div>
            <div class="field-value">${v}</div>
          </div>`).join("")}
      </div>
      <div class="info-box">
        <div class="info-title">Owner Details</div>
        <div class="field">
          <div class="field-label">Owner</div>
          <div class="field-value">${data.ownerName}</div>
        </div>
      </div>
    </div>

    <!-- Vaccine record -->
    <div class="vaccine-block">
      <div class="vaccine-title">💉 Vaccine Record</div>
      <div class="vaccine-grid">
        ${[
          ["Vaccine Name", data.vaccineName],
          ["Batch No.", data.batchNo],
          ["Date Administered", data.dateAdministered],
          ["Next Due Date", data.nextDueDate],
        ].map(([l, v]) => `
          <div class="field">
            <div class="field-label">${l}</div>
            <div class="field-value">${v || "—"}</div>
          </div>`).join("")}
      </div>
    </div>

    <!-- Signature -->
    <div class="signature-row">
      <div>
        <div class="sig-label">Administered by</div>
        <div class="sig-name">Dr. ${data.vetName || "_______________"}</div>
        <div class="sig-line"></div>
        <div class="sig-hint">Signature & Stamp</div>
      </div>
      <div class="brand-right">
        <div class="brand-issued">Issued via</div>
        <div class="brand-name">FurrCircle™</div>
        <div class="brand-sub">Official Pet Health Platform</div>
        <div class="brand-rn">A Product of Rhinon Tech</div>
      </div>
    </div>

    <div class="disclaimer">
      This certificate is digitally issued through FurrCircle, a product of Rhinon Tech (Registered).
      The veterinary information and medical details are provided by the issuing clinic.
      FurrCircle serves as the technology platform facilitating this record.
    </div>
  </div>
</div>
</body>
</html>
`;

// ─── Main Screen ────────────────────────────────────────────────────────────
export default function VaccineCertificateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { petId, vaccineId } = useLocalSearchParams<{ petId: string; vaccineId: string }>();

  const [pet, setPet] = useState<any>(null);
  const [vaccine, setVaccine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchData = async () => {
    if (!petId || !vaccineId) return;
    try {
      const [petData, vaccines] = await Promise.all([
        userPetsApi.getPetById(String(petId)),
        userHealthApi.listVaccines(String(petId)),
      ]);
      setPet(petData);
      setVaccine(
        vaccines.find((v: any) => String(v.id) === String(vaccineId)) ||
        vaccines[0] || null
      );
    } catch (e) {
      console.error("Certificate load error", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [petId, vaccineId]));

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { return d; }
  };

  const buildPdfData = () => ({
    petName: pet?.name || "—",
    species: pet?.species || "—",
    breed: pet?.breed || "—",
    age: pet?.age ? String(pet.age) : "—",
    ownerName: user?.name || pet?.owner?.name || "—",
    vaccineName: vaccine?.name || "—",
    batchNo: vaccine?.batchNo || vaccine?.batch_no || "—",
    dateAdministered: formatDate(vaccine?.lastVaccinationDate),
    nextDueDate: formatDate(vaccine?.nextDueDate),
    vetName: vaccine?.vetProfile?.name || vaccine?.veterinarian || "",
    clinicName: vaccine?.vetProfile?.clinicName || "Veterinary Clinic",
    licenseNumber: vaccine?.vetProfile?.licenseNumber || "",
    clinicAddress: vaccine?.vetProfile?.address || "",
    clinicLogoUrl: vaccine?.vetProfile?.clinicLogo || null,
  });

  const generatePdf = async (): Promise<string | null> => {
    setPdfLoading(true);
    try {
      const html = buildCertificateHtml(buildPdfData());
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      return uri;
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF.");
      return null;
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShare = async () => {
    const uri = await generatePdf();
    if (!uri) return;
    try {
      if (Sharing && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${pet?.name || "Pet"} Vaccine Certificate`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Sharing not available on this device.");
      }
    } catch { /* dismissed */ }
  };

  const handleDownload = async () => {
    const uri = await generatePdf();
    if (!uri) return;
    try {
      const fileName = `${(pet?.name || "pet").replace(/\s+/g, "_")}_vaccine_certificate.pdf`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: destUri });
      Alert.alert("Saved!", `Certificate saved as ${fileName}`);
    } catch {
      Alert.alert("Error", "Could not save the file.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!pet || !vaccine) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <ShieldCheck size={48} color={colors.textMuted} strokeWidth={1} />
        <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: "center" }}>
          Could not load certificate data.
        </Text>
      </View>
    );
  }

  const ownerName = user?.name || pet.owner?.name || "—";
  const vetName = vaccine?.vetProfile?.name || vaccine?.veterinarian || null;
  const clinicName = vaccine?.vetProfile?.clinicName || null;
  const clinicLogo = vaccine?.vetProfile?.clinicLogo || null;
  const licenseNumber = vaccine?.vetProfile?.licenseNumber || null;
  const clinicAddress = vaccine?.vetProfile?.address || null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={[s.headerBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Vaccine Certificate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 8 }}>

        {/* ── Certificate Card ── */}
        <View style={[s.card, { borderColor: CERT_BLUE }]}>
          {/* Corner brackets */}
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />

          {/* Header row */}
          <View style={s.headerRow}>
            {/* FurrCircle logo — left */}
            <View style={[s.logoBubble, { backgroundColor: "#eff6ff" }]}>
              <Text style={s.fcLogoText}>Furr{"\n"}Circle</Text>
            </View>

            <View style={{ flex: 1, alignItems: "center", marginHorizontal: 8 }}>
              <Text style={s.certTitle}>VACCINATION CERTIFICATE</Text>
              <Text style={s.certSubtitle}>OFFICIAL PET HEALTH RECORD</Text>
            </View>

            {/* Clinic logo — right */}
            <View style={[s.logoBubble, { backgroundColor: "#f1f5f9" }]}>
              {clinicLogo ? (
                <Image source={{ uri: clinicLogo }} style={{ width: 36, height: 36, borderRadius: 6 }} resizeMode="contain" />
              ) : (
                <Building2 size={22} color="#94a3b8" />
              )}
            </View>
          </View>

          {/* Gradient divider */}
          <LinearGradient
            colors={[CERT_BLUE, CERT_ACCENT, CERT_BLUE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.divider}
          />

          {/* Clinic info block */}
          <View style={s.clinicBlock}>
            <Text style={s.clinicName}>{clinicName || "Veterinary Clinic"}</Text>
            {clinicAddress ? <Text style={s.clinicSub}>{clinicAddress}</Text> : null}
            {licenseNumber ? <Text style={s.clinicSub}>License No: {licenseNumber}</Text> : null}
          </View>

          {/* Pet + Owner 2-col */}
          <View style={s.twoCol}>
            <InfoBox
              title="Pet Information"
              icon={<PawPrint size={12} color={CERT_BLUE} />}
              rows={[
                { label: "Name", value: pet.name },
                { label: "Species", value: pet.species },
                { label: "Breed", value: pet.breed },
                { label: "Age", value: pet.age ? String(pet.age) : null },
              ]}
            />
            <InfoBox
              title="Owner Details"
              icon={<ShieldCheck size={12} color={CERT_BLUE} />}
              rows={[{ label: "Owner", value: ownerName }]}
            />
          </View>

          {/* Vaccine record */}
          <View style={s.vaccineBlock}>
            <View style={s.vaccineHeader}>
              <Syringe size={13} color="#059669" />
              <Text style={s.vaccineHeaderText}>VACCINE RECORD</Text>
            </View>
            <View style={s.vaccineGrid}>
              <VaccineField label="Vaccine" value={vaccine.name} />
              <VaccineField label="Batch No." value={vaccine.batchNo || vaccine.batch_no || "—"} />
              <VaccineField label="Date Administered" value={formatDate(vaccine.lastVaccinationDate)} />
              <VaccineField label="Next Due" value={formatDate(vaccine.nextDueDate)} />
            </View>
          </View>

          {/* Signature row */}
          <View style={s.signatureRow}>
            <View>
              <Text style={s.sigLabel}>Administered by</Text>
              <Text style={s.sigName}>
                {vetName ? `Dr. ${vetName}` : "_______________"}
              </Text>
              <View style={s.sigLine} />
              <Text style={s.sigHint}>Signature & Stamp</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.issuedBy}>Issued via</Text>
              <Text style={s.brandName}>FurrCircle</Text>
              <Text style={s.brandSub}>Official Pet Health Platform</Text>
              <Text style={s.brandRhinon}>A Product of Rhinon Tech</Text>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerText}>
              This certificate is digitally issued through FurrCircle, a product of Rhinon Tech (Registered).
              Veterinary details are provided by the issuing clinic. FurrCircle is the technology platform facilitating this record.
            </Text>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={s.actions}>
          <Pressable
            onPress={handleShare}
            disabled={pdfLoading}
            style={[s.actionBtn, { backgroundColor: colors.brand }]}
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Share2 size={18} color="#fff" />
            )}
            <Text style={s.actionBtnText}>Share PDF</Text>
          </Pressable>

          <Pressable
            onPress={handleDownload}
            disabled={pdfLoading}
            style={[s.actionBtn, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}
          >
            <Download size={18} color={colors.textPrimary} />
            <Text style={[s.actionBtnText, { color: colors.textPrimary }]}>Save to Device</Text>
          </Pressable>
        </View>

        <Text style={{ textAlign: "center", fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
          FurrCircle · A Product of Rhinon Tech
        </Text>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
const InfoBox = ({ title, icon, rows }: {
  title: string;
  icon: React.ReactNode;
  rows: { label: string; value: string | null | undefined }[];
}) => (
  <View style={s.infoBox}>
    <View style={s.infoBoxHeader}>
      {icon}
      <Text style={s.infoBoxTitle}>{title}</Text>
    </View>
    {rows.filter((r) => r.value).map((r) => (
      <View key={r.label} style={{ marginBottom: 5 }}>
        <Text style={s.fieldLabel}>{r.label}</Text>
        <Text style={s.fieldValue}>{r.value}</Text>
      </View>
    ))}
  </View>
);

const VaccineField = ({ label, value }: { label: string; value: string }) => (
  <View style={{ width: "50%", paddingRight: 8, marginBottom: 8 }}>
    <Text style={s.fieldLabel}>{label}</Text>
    <Text style={s.fieldValue}>{value || "—"}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, borderWidth: 2.5,
    padding: 20, position: "relative", overflow: "hidden",
  },
  corner: { position: "absolute", width: 52, height: 52 },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopColor: "#1e3a8a", borderLeftColor: "#1e3a8a", borderTopLeftRadius: 10 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopColor: "#1e3a8a", borderRightColor: "#1e3a8a", borderTopRightRadius: 10 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomColor: "#1e3a8a", borderLeftColor: "#1e3a8a", borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomColor: "#1e3a8a", borderRightColor: "#1e3a8a", borderBottomRightRadius: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  logoBubble: { width: 46, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  fcLogoText: { fontSize: 10, fontWeight: "800", color: CERT_BLUE, textAlign: "center", lineHeight: 13 },
  certTitle: { fontSize: 14, fontWeight: "800", color: CERT_BLUE, letterSpacing: 0.5, textAlign: "center" },
  certSubtitle: { fontSize: 8, color: "#64748b", letterSpacing: 1.5, marginTop: 2, textAlign: "center" },
  divider: { height: 3, borderRadius: 2, marginBottom: 14 },
  clinicBlock: { backgroundColor: "#f0f4ff", borderRadius: 10, padding: 10, alignItems: "center", marginBottom: 14 },
  clinicName: { fontSize: 13, fontWeight: "700", color: CERT_BLUE },
  clinicSub: { fontSize: 9, color: "#64748b", marginTop: 2 },
  twoCol: { flexDirection: "row", gap: 10, marginBottom: 14 },
  infoBox: { flex: 1, backgroundColor: "#f8fafc", borderRadius: 10, padding: 10 },
  infoBoxHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  infoBoxTitle: { fontSize: 8, fontWeight: "700", color: CERT_BLUE, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldLabel: { fontSize: 8, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValue: { fontSize: 11, fontWeight: "600", color: "#1e293b", marginTop: 1 },
  vaccineBlock: { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#a7f3d0", borderRadius: 10, padding: 12, marginBottom: 16 },
  vaccineHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  vaccineHeaderText: { fontSize: 9, fontWeight: "700", color: "#059669", textTransform: "uppercase", letterSpacing: 1 },
  vaccineGrid: { flexDirection: "row", flexWrap: "wrap" },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 14, borderTopWidth: 1, borderTopColor: "#e2e8f0", borderStyle: "dashed" },
  sigLabel: { fontSize: 8, color: "#94a3b8" },
  sigName: { fontSize: 12, fontWeight: "700", color: CERT_BLUE, fontStyle: "italic", marginTop: 3 },
  sigLine: { width: 110, borderBottomWidth: 1, borderBottomColor: CERT_BLUE, marginTop: 16 },
  sigHint: { fontSize: 7, color: "#94a3b8", marginTop: 3 },
  issuedBy: { fontSize: 7, color: "#94a3b8" },
  brandName: { fontSize: 12, fontWeight: "700", color: CERT_BLUE, marginTop: 2 },
  brandSub: { fontSize: 8, color: "#64748b", marginTop: 1 },
  brandRhinon: { fontSize: 7, color: "#94a3b8", marginTop: 1 },
  disclaimer: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  disclaimerText: { fontSize: 8, color: "#94a3b8", textAlign: "center", lineHeight: 13 },
  actions: { flexDirection: "row", gap: 12, marginTop: 20, marginBottom: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
