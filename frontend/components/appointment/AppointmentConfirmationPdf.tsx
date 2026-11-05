"use client";

import {
  Defs,
  Document,
  Font,
  G,
  Image,
  LinearGradient,
  Page,
  Path,
  Stop,
  Svg,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { toTitleCase } from "../helper/titlecase";

export type ConfirmationDetails = {
  name: string;
  date: string;
  time: string;
  location: string;
  clientType?: string;
};

export type AppointmentNotifyDetails = ConfirmationDetails & {
  countryCode: string;
  phone: string;
  clientType?: string;
};

export const CLINIC_NAME = "Treasure Counseling Center";
export const CLINIC_LOCATION = "Treasure Counseling Center, Malappuram, Kerala";

const green = "#003e2b";
const gold = "#b58a44";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#faf7ee",
    color: green,
    fontFamily: "Times-Roman",
    padding: 28,
  },
  border: {
    position: "absolute",
    top: 7,
    left: 8,
    right: 8,
    bottom: 10,
    border: `0.8pt solid ${gold}`,
  },
  brand: { alignItems: "center", marginTop: 4 },
  logo: { width: 132, height: 105, objectFit: "contain" },
  name: { fontSize: 40, letterSpacing: 5, color: "#805b24", marginTop: 0 },
  caption: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    letterSpacing: 0.6,
    marginTop: 0,
  },
  tagline: {
    fontFamily: "Helvetica",
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 1.25,
  },
  ornament: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginVertical: 12,
  },
  rule: { width: 94, height: 0.5, backgroundColor: gold },
  diamond: {
    width: 5,
    height: 5,
    backgroundColor: "#805b24",
    transform: "rotate(45deg)",
  },
  heading: {
    fontFamily: "Times-Bold",
    textAlign: "center",
    fontSize: 36,
    lineHeight: 0.98,
  },
  rows: { marginHorizontal: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 76,
    flexShrink: 0,
    paddingVertical: 6,
    borderBottom: "0.5pt solid #d4b77f",
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    flexShrink: 0,
    backgroundColor: "#e5e8d1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  detail: { borderLeft: `0.6pt solid ${gold}`, paddingLeft: 14, flex: 1 },
  label: {
    fontFamily: "Helvetica",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 3,
  },
  value: { fontFamily: "Times-Bold", fontSize: 19 },
  message: {
    textAlign: "center",
    fontFamily: "Times-Italic",
    fontSize: 15,
    lineHeight: 1.3,
    marginTop: 9,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 30,
    marginHorizontal: 37,
    marginTop: "auto",
  },
  thanks: { fontFamily: "Times-Italic", fontSize: 22, marginBottom: 4 },
  clinic: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  signature: {
    borderLeft: `0.6pt solid ${gold}`,
    paddingLeft: 16,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.4,
  },
});

/* ---------- LEAVES (changed section) ---------- */

type LeafProps = {
  x: number;
  y: number;
  rotation: number; // 0 = pointing right, 90 = pointing down
  scale?: number;
  variant?: "green" | "gold";
};

const LEAF_COLORS = {
  green: { top: "#4f7a45", bottom: "#2c5232", vein: "#9db98a", mid: "#c9d8a8" },
  gold: { top: "#f0cf8a", bottom: "#d9a95a", vein: "#fff1cc", mid: "#f7e2ae" },
};

const LEAF_UPPER = "M0 0 C18 -26 62 -30 100 0 Z";
const LEAF_LOWER = "M0 0 C18 26 62 30 100 0 Z";
const LEAF_VEINS =
  "M18 0 L36 -13 M34 0 L56 -15 M52 0 L76 -13 M18 0 L36 13 M34 0 L56 15 M52 0 L76 13";

function Leaf({ x, y, rotation, scale = 1, variant = "green" }: LeafProps) {
  const c = LEAF_COLORS[variant];
  return (
    <G transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}>
      <Path d={LEAF_UPPER} fill={c.top} />
      <Path d={LEAF_LOWER} fill={c.bottom} />
      <Path
        d={LEAF_VEINS}
        stroke={c.vein}
        strokeWidth={0.8}
        strokeOpacity={0.7}
        fill="none"
      />
      <Path d="M0 0 L100 0" stroke={c.mid} strokeWidth={1.2} fill="none" />
    </G>
  );
}

// gold leaves first so green ones overlap them
const LEAVES: LeafProps[] = [
  { x: 70, y: 95, rotation: 25, scale: 0.6, variant: "gold" },
  { x: 72, y: 115, rotation: 95, scale: 0.5, variant: "gold" },
  { x: 78, y: 120, rotation: 60, scale: 0.6, variant: "gold" },
  { x: 86, y: 150, rotation: 75, scale: 0.55, variant: "gold" },
  { x: 22, y: 14, rotation: 10, scale: 1.1 },
  { x: 12, y: 24, rotation: 75, scale: 0.85 },
  { x: 38, y: 48, rotation: 30, scale: 0.95 },
  { x: 55, y: 72, rotation: 95, scale: 0.85 },
];

function Leaves({ bottom = false }: { bottom?: boolean }) {
  return (
    <Svg
      width={141}
      height={248}
      viewBox="0 0 141 248"
      style={
        bottom
          ? {
              position: "absolute",
              bottom: 0,
              right: 0,
              transform: "rotate(180deg)",
            }
          : { position: "absolute", top: 0, left: 0 }
      }
    >
      <Defs>
        <LinearGradient id="branch" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#8a5a2b" />
          <Stop offset="1" stopColor="#c8923f" />
        </LinearGradient>
      </Defs>

      {/* branch */}
      <Path
        d="M0 6 C28 24 52 52 70 92 C82 118 90 150 96 190"
        stroke="url(#branch)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />

      {LEAVES.map((leaf, i) => (
        <Leaf key={i} {...leaf} />
      ))}
    </Svg>
  );
}

/* ---------- END LEAVES ---------- */

function Icon({ type }: { type: "client" | "date" | "time" | "location" }) {
  const paths = {
    client: "M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8 M4 22v-3a8 8 0 0 1 16 0v3Z",
    date: "M4 5h16v16H4Z M8 2v6 M16 2v6 M4 10h16 M8 13h1 M12 13h1 M16 13h1 M8 17h1 M12 17h1 M16 17h1",
    time: "M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20 M12 6v7l5 3",
    location:
      "M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13Z M12 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6",
  };
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path
        d={paths[type]}
        stroke={green}
        strokeWidth={1.8}
        fill={type === "client" ? green : "none"}
      />
    </Svg>
  );
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.rule} />
      <View style={styles.diamond} />
      <View style={styles.rule} />
    </View>
  );
}

export function AppointmentConfirmationPdf({
  details,
  logoSrc,
}: {
  details: ConfirmationDetails;
  logoSrc?: string | null;
}) {
  const isStudent = details.clientType?.trim().toLowerCase() === "student";

  const rows = [
    {
      label: isStudent ? "STUDENT NAME:" : "CLIENT NAME:",
      value: toTitleCase(details.name),
      type: "client" as const,
    },
    { label: "DATE:", value: details.date, type: "date" as const },
    { label: "TIME:", value: details.time, type: "time" as const },
    { label: "LOCATION:", value: details.location, type: "location" as const },
  ].filter((row) => !(isStudent && row.type === "time"));

  return (
    <Document
      title={
        isStudent
          ? `Class Confirmation — ${details.name}`
          : `Appointment Confirmation — ${details.name}`
      }
      author={CLINIC_NAME}
    >
      <Page size="A4" style={styles.page} wrap={false}>
        <View style={styles.border} />
        <Leaves />
        <Leaves bottom />
        <View style={styles.brand}>
          {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
          <Text style={styles.name}>TREASURE</Text>
          <Text style={styles.caption}>FOR THE PEOPLE WHO NEED HELP</Text>
          <Text style={styles.tagline}>
            A safe space for healing,{"\n"}self-discovery and transformation.
          </Text>
        </View>
        <Ornament />
        <Text style={styles.heading}>
          {isStudent ? "CLASS\nCONFIRMATION" : "APPOINTMENT\nCONFIRMATION"}
        </Text>
        <Ornament />
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.type} style={styles.row}>
              <View style={styles.icon}>
                <Icon type={row.type} />
              </View>
              <View style={styles.detail}>
                <Text style={styles.label}>{row.label}</Text>
                <Text
                  style={[
                    styles.value,
                    {
                      fontSize:
                        row.value.length > 60
                          ? 13
                          : row.value.length > 28
                            ? 16
                            : row.type === "location"
                              ? 20
                              : 24,
                    },
                    /[\u0D00-\u0D7F]/.test(row.value)
                      ? { fontFamily: "ConfirmationMalayalam" }
                      : {},
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.message}>
          {isStudent
            ? "Your class has been scheduled.\nWe look forward to seeing you."
            : "Your appointment has been scheduled.\nWe look forward to seeing you."}
        </Text>
        <Ornament />
        <View style={styles.footer}>
          <View>
            <Text style={styles.thanks}>Thanks,</Text>
            <Text style={styles.clinic}>{CLINIC_NAME}</Text>
          </View>
          <Text style={styles.signature}>Treasure{"\n"}Counseling Center</Text>
        </View>
      </Page>
    </Document>
  );
}

function arrayBufferToDataUri(buffer: ArrayBuffer, mime: string) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

let fontRegistered = false;

async function ensurePdfAssets() {
  if (!fontRegistered) {
    Font.register({
      family: "ConfirmationMalayalam",
      src: `${window.location.origin}/fonts/NotoSansMalayalam-Regular.ttf`,
    });
    fontRegistered = true;
  }

  const logoResponse = await fetch(`${window.location.origin}/logo.png`);
  if (!logoResponse.ok) return null;
  return arrayBufferToDataUri(await logoResponse.arrayBuffer(), "image/png");
}

export function formatAppointmentDate(value?: string) {
  if (!value) return "To be confirmed";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatAppointmentTime(value?: string) {
  if (!value) return "To be confirmed";
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  if (Number.isNaN(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minutes || "00"} ${suffix}`;
}

export function toNotifyDetails(input: {
  name: string;
  scheduledDate?: string;
  scheduledTime?: string;
  countryCode: string;
  phone: string;
  location?: string;
  clientType?: string;
}): AppointmentNotifyDetails {
  const isStudent = input.clientType?.trim().toLowerCase() === "student";

  return {
    name: input.name.trim(),
    date: isStudent ? "നാളെ" : formatAppointmentDate(input.scheduledDate),
    time: formatAppointmentTime(input.scheduledTime),
    location: input.location || CLINIC_LOCATION,
    countryCode: input.countryCode,
    phone: input.phone,
    clientType: input.clientType,
  };
}

export function getWhatsAppNumber(details: AppointmentNotifyDetails) {
  let phoneDigits = details.phone.replace(/\D/g, "");
  const codeDigits = (details.countryCode || "+91").replace(/\D/g, "") || "91";

  if (phoneDigits.startsWith("00")) {
    phoneDigits = phoneDigits.slice(2);
  }
  if (codeDigits && phoneDigits.startsWith(codeDigits)) {
    return phoneDigits;
  }
  if (phoneDigits.startsWith("0")) {
    phoneDigits = phoneDigits.replace(/^0+/, "");
  }
  return `${codeDigits}${phoneDigits}`;
}

export function confirmationFileName(name: string, clientType?: string) {
  const safeName =
    name
      .trim()
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-") || "client";
  const prefix =
    clientType?.trim().toLowerCase() === "student" ? "class" : "appointment";
  return `${prefix}-confirmation-${safeName}.pdf`;
}

export function buildWhatsAppMessage(details: AppointmentNotifyDetails) {
  const isStudent = details.clientType?.trim().toLowerCase() === "student";

  if (isStudent) {
    return [
      "ക്ലാസ്",
      "",
      `വിദ്യാർത്ഥിയുടെ പേര്: ${toTitleCase(details.name)}`,
      `തീയതി: ${details.date}`,
      `സ്ഥലം: ${details.location}`,
    ].join("\n");
  }

  return [
    `Hello ${toTitleCase(details.name)},`,
    "",
    `Greetings from ${CLINIC_NAME}.`,
    "",
    "Your appointment has been scheduled.",
    "",
    `Client name: ${toTitleCase(details.name)}`,
    `Date: ${details.date}`,
    `Time: ${details.time}`,
    `Location: ${details.location}`,
    "",
    "Your appointment confirmation PDF is attached with this message. Please download and keep it for your visit.",
    "",
    "We look forward to seeing you.",
    "",
    `${CLINIC_NAME}`,
  ].join("\n");
}

export function buildWhatsAppUrl(details: AppointmentNotifyDetails) {
  const number = getWhatsAppNumber(details);
  const text = encodeURIComponent(buildWhatsAppMessage(details));
  return `https://api.whatsapp.com/send/?phone=${number}&text=${text}&type=phone_number&app_absent=0`;
}

export async function createConfirmationBlob(details: ConfirmationDetails) {
  const logoSrc = await ensurePdfAssets();
  return pdf(
    <AppointmentConfirmationPdf details={details} logoSrc={logoSrc} />,
  ).toBlob();
}

export function triggerPdfDownload(blob: Blob, name: string, clientType?: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = confirmationFileName(name, clientType);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function downloadConfirmationPdf(details: ConfirmationDetails) {
  const blob = await createConfirmationBlob(details);
  triggerPdfDownload(blob, details.name, details.clientType);
  return blob;
}

export function openWhatsAppNotify(details: AppointmentNotifyDetails) {
  window.open(buildWhatsAppUrl(details), "_blank", "noopener,noreferrer");
}

export async function shareOrNotifyConfirmation(
  details: AppointmentNotifyDetails,
) {
  openWhatsAppNotify(details);
  return "whatsapp";
}
