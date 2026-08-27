"use client";

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Svg,
  Path,
  Circle,
  pdf,
} from "@react-pdf/renderer";
import { ReportPdfPage } from "@/components/ReportPdfPages";

const GREEN = "#064C2E";
const GOLD = "#C99532";

/* =========================================================
   TYPES
========================================================= */

type MalayalamImage = {
  src: string;
  width: number;
  height: number;
};

export type ApplicationPdfData = {
  name: string;
  age: string;
  relative: string;
  address: string;
  phone: string;
  currentProblem?: string;
  date?: string;
  signatureName?: string;
  studentIntake?: Record<string, string>;
  parentsDetails?: Record<string, string>;
  assessmentReport?: Record<string, string>;
  mentalStatusExam?: Record<string, any>;
  remediationEntries?: any[];
};

export type ApplicationPdfPage =
  | "Application Form"
  | "Student Intake Form"
  | "Parents' Details"
  | "Assessment Report"
  | "Remediation & Improvement"
  | "Mental Status Exam"
  | "Plans";

type MalayalamImages = {
  headerTop: MalayalamImage;
  headerBottom: MalayalamImage;

  title: MalayalamImage;
  location: MalayalamImage;

  name: MalayalamImage;
  age: MalayalamImage;
  relative: MalayalamImage;
  address: MalayalamImage;
  phone: MalayalamImage;

  currentProblem: MalayalamImage;
  consent1: MalayalamImage;

  date: MalayalamImage;
  signName: MalayalamImage;
  sign: MalayalamImage;
};

type ApplicationPdfProps = {
  data: ApplicationPdfData;
  logoSrc: string | null;
  ml: MalayalamImages;
  pages?: ApplicationPdfPage[];
};

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingHorizontal: 42,
    paddingBottom: 58,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    position: "relative",
  },

  /* ================= HEADER ================= */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 74,
    marginBottom: 6,
  },

  brand: {
    width: "52%",
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 67,
    height: 58,
    objectFit: "contain",
  },

  brandText: {
    marginLeft: 10,
  },

  treasure: {
    fontFamily: "Times-Roman",
    fontSize: 27,
    letterSpacing: 3,
    color: GOLD,
  },

  tagline: {
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.6,
    color: GREEN,
    textAlign: "center",
  },

  headerRight: {
    width: "46%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  headerMalayalam: {
    width: "58%",
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },

  headerMalayalamGap: {
    height: 3,
  },

  contactContainer: {
    width: "42%",
    borderLeftWidth: 1,
    borderLeftColor: GOLD,
    paddingLeft: 9,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  contactText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: "#111111",
  },

  iconContainer: {
    width: 16,
    height: 16,
    marginRight: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ================= TITLE ================= */

  titleArea: {
    alignItems: "center",
    marginTop: 1,
    marginBottom: 10,
  },

  locationWrapper: {
    marginTop: 5,
  },

  /* ================= PERSONAL DETAILS ================= */

  formBox: {
    borderWidth: 1,
    borderColor: GREEN,

    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 13,

    marginBottom: 18,
  },

  field: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 26,
    marginBottom: 5,
  },

  labelContainer: {
    width: 122,
    minHeight: 17,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingRight: 6,
  },

  valueLine: {
    flex: 1,
    minHeight: 18,

    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "dashed",

    justifyContent: "flex-end",
    paddingBottom: 2,
  },

  value: {
    fontFamily: "Helvetica",
    fontSize: 10.5,
    color: "#111111",
  },

  extraAddressLine: {
    marginLeft: 122,
    height: 19,

    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "dashed",

    marginBottom: 4,
  },

  /* ======================================================
     CURRENT PROBLEM + CONSENT
  ====================================================== */

  problemConsentSection: {
    position: "relative",

    borderWidth: 1,
    borderColor: GREEN,

    paddingTop: 25,
    paddingHorizontal: 13,
    paddingBottom: 10,

    marginBottom: 13,
  },

  sectionTab: {
    position: "absolute",

    left: 10,
    top: -12,

    height: 26,

    backgroundColor: GREEN,
    paddingHorizontal: 10,

    justifyContent: "center",
    alignItems: "center",
  },

  problemWritingArea: {
    minHeight: 40,
    paddingBottom: 8,
  },

  problemText: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 3,
  },

  consent: {
    marginTop: 2,

    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 0,

    minHeight: 72,

    justifyContent: "center",
  },

  consentImageWrap: {
    width: "100%",
    alignItems: "flex-start",
  },

  /* ================= SIGNATURE ================= */

  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  signatureLeft: {
    width: "40%",
    marginTop: 34,
  },

  signatureRight: {
    width: "47%",
  },

  signatureRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 25,
    marginBottom: 9,
  },

  signatureLabelContainer: {
    width: 50,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  signatureLine: {
    flex: 1,
    minHeight: 17,

    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "dashed",

    justifyContent: "flex-end",
    paddingBottom: 2,
  },

  signatureValue: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
  },

  /* ================= FOOTER ================= */

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
  },
});

/* =========================================================
   ARRAY BUFFER -> DATA URI
========================================================= */

function arrayBufferToDataUri(
  buffer: ArrayBuffer,
  mime: string,
): string {
  const bytes = new Uint8Array(buffer);

  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize),
    );
  }

  return `data:${mime};base64,${btoa(binary)}`;
}

/* =========================================================
   LOAD MALAYALAM FONT
========================================================= */

async function loadMalayalamFont() {
  const fontName = "AnekMalayalamPdf";

  if (document.fonts.check(`12px "${fontName}"`)) {
    return;
  }

  const font = new FontFace(
    fontName,
    `url(${window.location.origin}/fonts/AnekMalayalam-VariableFont.ttf)`,
    {
      weight: "100 800",
    },
  );

  const loadedFont = await font.load();

  document.fonts.add(loadedFont);

  await document.fonts.ready;
}

/* =========================================================
   MALAYALAM TEXT -> PNG
========================================================= */

function renderMalayalamText(
  text: string,
  options: {
    fontSize?: number;
    color?: string;
    background?: string;

    paddingX?: number;
    paddingY?: number;

    maxWidth?: number;
    fixedWidth?: number;

    bold?: boolean;
    center?: boolean;

    lineHeightMultiplier?: number;
  } = {},
): MalayalamImage {
  const {
    fontSize = 14,
    color = "#111111",
    background = "transparent",

    paddingX = 0,
    paddingY = 0,

    maxWidth = 520,
    fixedWidth,

    bold = false,
    center = false,

    lineHeightMultiplier = 1.45,
  } = options;

  const canvas = document.createElement("canvas");

  let ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  const fontWeight = bold ? "700" : "400";

  ctx.font = `${fontWeight} ${fontSize}px AnekMalayalamPdf`;

  const wrappingWidth = fixedWidth
    ? fixedWidth - paddingX * 2
    : maxWidth;

  /* =====================================================
     WORD WRAPPING
  ===================================================== */

  const lines: string[] = [];

  const paragraphs = text.split("\n");

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine
        ? `${currentLine} ${word}`
        : word;

      const measuredWidth =
        ctx.measureText(candidate).width;

      if (
        measuredWidth > wrappingWidth &&
        currentLine
      ) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  if (lines.length === 0) {
    lines.push(text);
  }

  /* =====================================================
     MALAYALAM GLYPH SAFETY
  ===================================================== */

  const glyphSafetyTop = Math.ceil(
    fontSize * 0.45,
  );

  const glyphSafetyBottom = Math.ceil(
    fontSize * 0.3,
  );

  const lineHeight =
    fontSize * lineHeightMultiplier;

  const measuredWidths = lines.map((line) => {
    if (!line) {
      return 1;
    }

    return ctx!.measureText(line).width;
  });

  const textWidth = Math.max(
    ...measuredWidths,
    1,
  );

  const logicalWidth = fixedWidth
    ? fixedWidth
    : Math.ceil(
        Math.min(
          Math.max(textWidth, 1),
          maxWidth,
        ) +
          paddingX * 2,
      );

  const logicalHeight = Math.ceil(
    lines.length * lineHeight +
      paddingY * 2 +
      glyphSafetyTop +
      glyphSafetyBottom,
  );

  /* =====================================================
     HIGH RESOLUTION CANVAS
  ===================================================== */

  const dpr = 3;

  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas unavailable");
  }

  ctx.scale(dpr, dpr);

  ctx.clearRect(
    0,
    0,
    logicalWidth,
    logicalHeight,
  );

  if (background !== "transparent") {
    ctx.fillStyle = background;

    ctx.fillRect(
      0,
      0,
      logicalWidth,
      logicalHeight,
    );
  }

  ctx.font = `${fontWeight} ${fontSize}px AnekMalayalamPdf`;

  ctx.fillStyle = color;
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    if (!line) {
      return;
    }

    let x = paddingX;

    if (center) {
      const measuredLineWidth =
        ctx!.measureText(line).width;

      x =
        (logicalWidth - measuredLineWidth) /
        2;
    }

    const y =
      paddingY +
      glyphSafetyTop +
      index * lineHeight;

    ctx!.fillText(
      line,
      x,
      y,
    );
  });

  return {
    src: canvas.toDataURL("image/png"),
    width: logicalWidth,
    height: logicalHeight,
  };
}

/* =========================================================
   PRESERVE IMAGE RATIO
========================================================= */

function getImageSize(
  image: MalayalamImage,
  maxWidth: number,
  maxHeight: number,
) {
  const widthRatio =
    maxWidth / image.width;

  const heightRatio =
    maxHeight / image.height;

  const ratio = Math.min(
    widthRatio,
    heightRatio,
    1,
  );

  return {
    width: image.width * ratio,
    height: image.height * ratio,
  };
}

/* =========================================================
   PREPARE ASSETS
========================================================= */

async function prepareAssets() {
  await loadMalayalamFont();

  /* ================= LOGO ================= */

  let logoSrc: string | null = null;

  try {
    const logoResponse = await fetch(
      `${window.location.origin}/logo.png`,
    );

    if (logoResponse.ok) {
      const logoBuffer =
        await logoResponse.arrayBuffer();

      logoSrc = arrayBufferToDataUri(
        logoBuffer,
        "image/png",
      );
    }
  } catch (error) {
    console.error(
      "Failed to load logo:",
      error,
    );
  }

  /* =====================================================
     MALAYALAM ASSETS
  ===================================================== */

  const ml: MalayalamImages = {
    /* ================= HEADER TOP ================= */

    headerTop: renderMalayalamText(
      "പഠന പ്രയാസങ്ങൾക്ക് പരിഹാരം പരിശീലനം",
      {
        fontSize: 7.5,
        maxWidth: 125,
        center: true,
        paddingX: 2,
        paddingY: 2,
        lineHeightMultiplier: 1.45,
      },
    ),

    /* ================= HEADER BOTTOM ================= */

    headerBottom: renderMalayalamText(
      `ഫാമിലി കൗൺസിലിംഗ്
പേർസണൽ കൗൺസിലിംഗ്`,
      {
        fontSize: 7.5,
        maxWidth: 125,
        center: true,
        paddingX: 2,
        paddingY: 2,
        lineHeightMultiplier: 1.45,
      },
    ),

    /* ================= TITLE ================= */

    title: renderMalayalamText(
      "അപേക്ഷ ഫോറം",
      {
        fontSize: 16,

        color: "#FFFFFF",
        background: GREEN,

        paddingX: 16,
        paddingY: 6,

        bold: true,
        center: true,

        lineHeightMultiplier: 1.4,
      },
    ),

    /* ================= SUB TITLE ================= */

    location: renderMalayalamText(
      "കൗൺസിലിംഗ് , ഹിപ്നോതെരപ്പി",
      {
        fontSize: 11.5,
        paddingY: 2,
      },
    ),

    /* ================= FORM LABELS ================= */

    name: renderMalayalamText(
      "പേര്",
      {
        fontSize: 11.5,
        paddingY: 2,
      },
    ),

    age: renderMalayalamText(
      "വയസ്സ്",
      {
        fontSize: 11.5,
        paddingY: 2,
      },
    ),

    relative: renderMalayalamText(
      "അടുത്ത ബന്ധുവിന്റെ പേര്, ഫോൺ",
      {
        fontSize: 11.5,
        paddingY: 2,
      },
    ),

    address: renderMalayalamText(
      "പൂർണ്ണ മേൽവിലാസം",
      {
        fontSize: 11.5,
        paddingY: 2,
      },
    ),

    phone: renderMalayalamText(
      "ഫോൺ",
      {
        fontSize: 11.5,
        paddingY: 2,
      },
    ),

    /* ================= CURRENT PROBLEM ================= */

    currentProblem: renderMalayalamText(
      "ഇപ്പോഴത്തെ പ്രശ്നം",
      {
        fontSize: 12,

        color: "#FFFFFF",
        background: GREEN,

        paddingX: 10,
        paddingY: 4,

        bold: true,
        center: true,

        lineHeightMultiplier: 1.4,
      },
    ),

    /* ================= CONSENT ================= */

    consent1: renderMalayalamText(
   "എൻ്റെ പരിപൂർണ സമ്മതത്തോടെയാണ് ഞാൻ കൗൺസിലിംഗിന് എത്തിയിരിക്കുന്നത്. ഇവിടെനിന്നും നൽകുന്ന നിർദേശങ്ങൾ സീകരിക്കുവാനം ചിട്ടയായ ജീവിത ശൈലിയിലൂടെ എൻ്റെ പ്രശ്ന‌ങ്ങൾ പരിഹരിക്കുവാനും ഞാൻ ആത്മാർത്ഥമായി ശ്രമിക്കും.",
      {
        fontSize: 10.5,

        maxWidth: 471,
        fixedWidth: 475,

        paddingX: 2,
        paddingY: 2,

        lineHeightMultiplier: 1.45,
      },
    ),

    /* ================= SIGNATURE ================= */

    date: renderMalayalamText(
      "തീയതി",
      {
        fontSize: 10.5,
        paddingY: 2,
      },
    ),

    signName: renderMalayalamText(
      "പേര്",
      {
        fontSize: 10.5,
        paddingY: 2,
      },
    ),

    sign: renderMalayalamText(
      "ഒപ്പ്",
      {
        fontSize: 10.5,
        paddingY: 2,
      },
    ),
  };

  return {
    logoSrc,
    ml,
  };
}

/* =========================================================
   MALAYALAM IMAGE
========================================================= */

function MalayalamTextImage({
  image,
  maxWidth,
  maxHeight,
}: {
  image: MalayalamImage;
  maxWidth: number;
  maxHeight: number;
}) {
  const dimensions = getImageSize(
    image,
    maxWidth,
    maxHeight,
  );

  return (
    <Image
      src={image.src}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        objectFit: "contain",
      }}
    />
  );
}

/* =========================================================
   PHONE ICON
========================================================= */

function PhoneIcon() {
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
    >
      <Circle
        cx="12"
        cy="12"
        r="12"
        fill={GOLD}
      />

      <Path
        d="
          M7.2 5.8
          C7 5.5 6.6 5.4 6.2 5.6
          L4.7 6.5
          C4.3 6.8 4.1 7.3 4.2 7.8
          C5.1 13.4 9.5 17.8 15.2 18.8
          C15.7 18.9 16.2 18.7 16.5 18.3
          L17.4 16.8
          C17.6 16.4 17.5 16 17.2 15.8
          L14.6 13.8
          C14.3 13.6 13.9 13.6 13.6 13.9
          L12.5 15
          C10.2 13.9 8.2 11.9 7.1 9.6
          L8.2 8.5
          C8.5 8.2 8.5 7.8 8.3 7.5
          Z
        "
        fill="#FFFFFF"
      />
    </Svg>
  );
}

/* =========================================================
   WHATSAPP ICON
========================================================= */

function WhatsAppIcon() {
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
    >
      <Circle
        cx="12"
        cy="12"
        r="12"
        fill={GREEN}
      />

      <Path
        d="
          M12 5
          C8.2 5 5.2 7.8 5.2 11.3
          C5.2 12.6 5.6 13.8 6.3 14.9
          L5.5 18.2
          L8.9 17.4
          C9.9 17.9 10.9 18.1 12 18.1
          C15.8 18.1 18.8 15.3 18.8 11.7
          C18.8 8 15.8 5 12 5
          Z
        "
        fill="#FFFFFF"
      />

      <Path
        d="
          M9 8.5
          C8.7 8.3 8.3 8.4 8.1 8.8
          C7.7 9.5 7.9 10.6 8.5 11.7
          C9.5 13.5 11.1 14.8 13 15.4
          C14.1 15.8 15.1 15.6 15.7 15
          C16 14.7 16 14.3 15.7 14.1
          L14.2 13.1
          C14 13 13.7 13 13.5 13.2
          L12.9 13.8
          C11.8 13.4 10.6 12.4 10 11.4
          L10.6 10.8
          C10.8 10.6 10.8 10.3 10.7 10.1
          Z
        "
        fill={GREEN}
      />
    </Svg>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  value,
  extraLine = false,
}: {
  label: MalayalamImage;
  value?: string;
  extraLine?: boolean;
}) {
  return (
    <>
      <View style={styles.field}>
        <View style={styles.labelContainer}>
          <MalayalamTextImage
            image={label}
            maxWidth={115}
            maxHeight={19}
          />
        </View>

        <View style={styles.valueLine}>
          {value ? (
            <Text style={styles.value}>
              {value}
            </Text>
          ) : null}
        </View>
      </View>

      {extraLine ? (
        <View
          style={styles.extraAddressLine}
        />
      ) : null}
    </>
  );
}

/* =========================================================
   SIGNATURE FIELD
========================================================= */

function SignatureField({
  label,
  value,
}: {
  label: MalayalamImage;
  value?: string;
}) {
  return (
    <View style={styles.signatureRow}>
      <View
        style={
          styles.signatureLabelContainer
        }
      >
        <MalayalamTextImage
          image={label}
          maxWidth={42}
          maxHeight={16}
        />
      </View>

      <View style={styles.signatureLine}>
        {value ? (
          <Text
            style={styles.signatureValue}
          >
            {value}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/* Legacy generic page styles are kept out of the document; each report section
   now has its own dedicated PDF component in ReportPdfPages. */
/* function ReportPage({ title, data }: { title: string; data: ApplicationPdfData }) {
  const rows: [string, string | undefined][] =
    title === "Application Form"
      ? [
          ["Name", data.name],
          ["Age", data.age],
          ["Relative's name", data.relative],
          ["Address", data.address],
          ["Phone", data.phone],
          ["Current problem", data.currentProblem],
        ]
      : title === "Mental Status Exam"
        ? [["Client Name", data.name], ["Date", data.date]]
        : [["Client", data.name], ["Date", data.date]];

  return (
    <Page size="A4" style={reportStyles.page} wrap={false}>
      <Text style={reportStyles.brand}>TREASURE</Text>
      <Text style={reportStyles.subtitle}>CLIENT REPORT</Text>
      <Text style={reportStyles.title}>{title}</Text>
      <View style={reportStyles.table}>
        {Array.from({ length: title === "Remediation & Improvement" ? 8 : Math.max(8, rows.length + 2) }).map((_, index) => {
          const row = rows[index] ?? ["", ""];
          return (
            <View style={reportStyles.row} key={`${title}-${index}`}>
              <Text style={reportStyles.label}>{row[0] ?? ""}</Text>
              <Text style={reportStyles.value}>{row[1] ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <Text style={reportStyles.footer}>Name & Signature: ______________________________</Text>
    </Page>
  );
}

const reportStyles = StyleSheet.create({
  page: { padding: 42, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  brand: { fontSize: 26, color: GOLD, letterSpacing: 3, textAlign: "center" },
  subtitle: { marginTop: 5, fontSize: 9, color: GREEN, textAlign: "center" },
  title: { marginTop: 44, marginBottom: 24, fontSize: 18, fontFamily: "Helvetica-Bold", textAlign: "center", color: GREEN },
  table: { borderWidth: 1, borderColor: "#555555" },
  row: { minHeight: 54, flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#777777" },
  label: { width: "36%", padding: 9, fontSize: 11, borderRightWidth: 1, borderRightColor: "#777777" },
  value: { flex: 1, padding: 9, fontSize: 11 },
  footer: { marginTop: 36, fontSize: 11 },
});
*/

/* =========================================================
   PDF
========================================================= */

export function ApplicationPdf({
  data,
  logoSrc,
  ml,
  pages = ["Application Form"],
}: ApplicationPdfProps) {
  return (
    <Document>
      {pages.includes("Application Form") && <Page
        size="A4"
        style={styles.page}
        wrap={false}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <View
          style={styles.header}
          wrap={false}
        >
          {/* BRAND */}

          <View style={styles.brand}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                style={styles.logo}
              />
            ) : null}

            <View style={styles.brandText}>
              <Text style={styles.treasure}>
                TREASURE
              </Text>

              <Text style={styles.tagline}>
                FOR THE PEOPLE WHO MATTER
              </Text>
            </View>
          </View>

          {/* RIGHT HEADER */}

          <View style={styles.headerRight}>
            <View
              style={
                styles.headerMalayalam
              }
            >
              <MalayalamTextImage
                image={ml.headerTop}
                maxWidth={125}
                maxHeight={31}
              />

              <View
                style={
                  styles.headerMalayalamGap
                }
              />

              <MalayalamTextImage
                image={ml.headerBottom}
                maxWidth={125}
                maxHeight={31}
              />
            </View>

            {/* CONTACT */}

            <View
              style={
                styles.contactContainer
              }
            >
              <View style={styles.contactRow}>
                <View
                  style={
                    styles.iconContainer
                  }
                >
                  <PhoneIcon />
                </View>

                <Text
                  style={styles.contactText}
                >
                  9061200099
                </Text>
              </View>

              <View style={styles.contactRow}>
                <View
                  style={
                    styles.iconContainer
                  }
                >
                  <WhatsAppIcon />
                </View>

                <Text
                  style={styles.contactText}
                >
                  7306941801
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* =================================================
            TITLE
        ================================================= */}

        <View
          style={styles.titleArea}
          wrap={false}
        >
          <MalayalamTextImage
            image={ml.title}
            maxWidth={145}
            maxHeight={31}
          />

          <View
            style={
              styles.locationWrapper
            }
          >
            <MalayalamTextImage
              image={ml.location}
              maxWidth={210}
              maxHeight={22}
            />
          </View>
        </View>

        {/* =================================================
            PERSONAL DETAILS
        ================================================= */}

        <View
          style={styles.formBox}
          wrap={false}
        >
          <FormField
            label={ml.name}
            value={data.name}
          />

          <FormField
            label={ml.age}
            value={data.age}
          />

          <FormField
            label={ml.relative}
            value={data.relative}
          />

          <FormField
            label={ml.address}
            value={data.address}
            extraLine
          />

          <FormField
            label={ml.phone}
            value={data.phone}
          />
        </View>

        {/* =================================================
            CURRENT PROBLEM + CONSENT
        ================================================= */}

        <View
          style={
            styles.problemConsentSection
          }
          wrap={false}
        >
          {/* TITLE TAB */}

          <View style={styles.sectionTab}>
            <MalayalamTextImage
              image={ml.currentProblem}
              maxWidth={125}
              maxHeight={24}
            />
          </View>

          <View
            style={
              styles.problemWritingArea
            }
          >
            {data.currentProblem ? (
              <Text
                style={
                  styles.problemText
                }
              >
                {data.currentProblem}
              </Text>
            ) : null}

          </View>

          {/* =================================================
              CONSENT
          ================================================= */}

          <View style={styles.consent}>
            <View
              style={
                styles.consentImageWrap
              }
            >
              <MalayalamTextImage
                image={ml.consent1}
                maxWidth={475}
                maxHeight={90}
              />
            </View>
          </View>
        </View>

        {/* =================================================
            SIGNATURE
        ================================================= */}

        <View
          style={styles.signatureArea}
          wrap={false}
        >
          <View
            style={styles.signatureLeft}
          >
            <SignatureField
              label={ml.date}
              value={data.date}
            />
          </View>

          <View
            style={styles.signatureRight}
          >
            <SignatureField
              label={ml.signName}
              value={data.signatureName}
            />

            <SignatureField
              label={ml.sign}
            />
          </View>
        </View>

        {/* =================================================
            FOOTER
        ================================================= */}

        <View
          style={styles.footer}
          fixed
        >
          <Svg
            width={595}
            height={50}
            viewBox="0 0 595 50"
          >
            {/* GOLD */}

            <Path
              d="
                M 0 39
                L 595 6
                L 595 12
                L 0 45
                Z
              "
              fill={GOLD}
            />

            {/* GREEN */}

            <Path
              d="
                M 0 44
                L 595 11
                L 595 50
                L 0 50
                Z
              "
              fill={GREEN}
            />
          </Svg>
        </View>
      </Page>}
      {pages.filter((page) => page !== "Application Form").map((page) => (
        <ReportPdfPage key={page} page={page} data={data} />
      ))}
    </Document>
  );
}

/* =========================================================
   DOWNLOAD
========================================================= */

export async function downloadApplicationPdf(
  data: ApplicationPdfData,
  pages: ApplicationPdfPage[] = ["Application Form"],
) {
  try {
    const {
      logoSrc,
      ml,
    } = await prepareAssets();

    const blob = await pdf(
      <ApplicationPdf
        data={data}
        logoSrc={logoSrc}
        ml={ml}
        pages={pages}
      />,
    ).toBlob();

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    const safeName =
      data.name
        ?.trim()
        .replace(
          /[^a-zA-Z0-9-_ ]/g,
          "",
        )
        .replace(/\s+/g, "-") ||
      "client";

    link.download =
      `application-form-${safeName}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error(
      "PDF generation failed:",
      error,
    );

    throw error;
  }
}
export async function printApplicationPdf(
  data: ApplicationPdfData,
  pages: ApplicationPdfPage[] = ["Application Form"],
) {
  try {
    const { logoSrc, ml } = await prepareAssets();

    const blob = await pdf(
      <ApplicationPdf
        data={data}
        logoSrc={logoSrc}
        ml={ml}
        pages={pages}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);

    // Open PDF in new tab — browser's print dialog will handle printer/scanner
    const printWindow = window.open(url, "_blank");

    if (printWindow) {
      printWindow.addEventListener("load", () => {
        setTimeout(() => printWindow.print(), 500);
      });
    }

    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    console.error("PDF print failed:", error);
    throw error;
  }
}
