import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ApplicationPdfData } from "@/components/ApplicationPdf";

type PageProps = { data: ApplicationPdfData };

function labelToKey(label: string, index: number): string {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${index}`;
}

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 9, color: "#222" },
  heading: { textAlign: "center", fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  table: { borderWidth: 1, borderColor: "#777" },
  row: { flexDirection: "row", minHeight: 18, borderBottomWidth: 1, borderBottomColor: "#999" },
  cell: { padding: 4, borderRightWidth: 1, borderRightColor: "#999" },
  serial: { width: 28 },
  assessment: { flex: 1 },
  score: { width: 180, borderRightWidth: 0 },
  header: { fontFamily: "Helvetica-Bold", textAlign: "center", padding: 5 },
  subTable: { marginTop: 18 },
  subHeader: { flexDirection: "row", minHeight: 24, backgroundColor: "#f4f4f2", borderBottomWidth: 1, borderBottomColor: "#777" },
  blankRow: { minHeight: 34 },
  pageTwoTable: { borderWidth: 1, borderColor: "#777", marginBottom: 18 },
  largeRow: { flexDirection: "row", minHeight: 92, borderBottomWidth: 1, borderBottomColor: "#999" },
  largeLabel: { width: "48%", padding: 5, borderRightWidth: 1, borderRightColor: "#999" },
  shortRow: { minHeight: 27 },
});

// Exact same labels + indices as AssessmentReportForm
const assessmentRows: { label: string; index: number }[] = [
  { label: "Logical Thinking", index: 0 },
  { label: "Listening & following verbal instructions", index: 1 },
  { label: "Sequencing of Numbers", index: 2 },
  { label: "Sequencing of incidents", index: 3 },
  { label: "Reasoning", index: 4 },
  { label: "Number concept", index: 5 },
  { label: "General awareness", index: 6 },
  { label: "Age appropriate colour identification", index: 21 },
  { label: "Attention", index: 7 },
  { label: "Visual memory", index: 8 },
  { label: "Verbal memory", index: 9 },
  { label: "Reading (Level)", index: 10 },
];

const readingRows = [
  "Transposition", "Reversal", "Omissions", "Substitutions",
  "Insertions", "Pauses", "Inversion", "Comprehension",
];
const writingRows = [
  "Transposition", "Reversal", "Omissions", "Substitutions",
  "Inversion", "Self-correction", "Insertion",
];
function AssessmentTable({ data }: { data: ApplicationPdfData }) {
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.serial, styles.header]}>Sl</Text>
        <Text style={[styles.cell, styles.assessment, styles.header]}>Type of Assessment</Text>
        <Text style={[styles.cell, styles.score, styles.header]}>Score</Text>
      </View>
      {assessmentRows.map((row, i) => (
        <View style={styles.row} key={row.label}>
          <Text style={[styles.cell, styles.serial]}>{i + 1}</Text>
          <Text style={[styles.cell, styles.assessment]}>{row.label}</Text>
          <Text style={[styles.cell, styles.score]}>
            {data.assessmentReport?.[labelToKey(row.label, row.index)] || ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ReadingTable({ data }: { data: ApplicationPdfData }) {
  return (
    <View style={[styles.table, styles.subTable]}>
      <View style={styles.subHeader}>
        <Text style={[styles.cell, styles.assessment, styles.header]}>General Reading</Text>
        <Text style={[styles.cell, styles.score, styles.header]}>Score</Text>
      </View>
      {readingRows.map((label, i) => {
        const fullLabel = `General Reading - ${label}`;
        return (
          <View style={[styles.row, styles.blankRow]} key={label}>
            <Text style={[styles.cell, styles.assessment]}>{label}</Text>
            <Text style={[styles.cell, styles.score]}>
              {data.assessmentReport?.[labelToKey(fullLabel, i + 22)] || ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AssessmentPage({ data }: PageProps) {
  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <Text style={styles.heading}>Assessment Report Sheet</Text>
      <AssessmentTable data={data} />
      <ReadingTable data={data} />
      <View style={[styles.table, styles.subTable]}>
        <View style={styles.row}>
          <Text style={[styles.cell, styles.assessment]}>13&nbsp;&nbsp; Writing</Text>
          <Text style={[styles.cell, styles.score]} />
        </View>
      </View>
            <View style={[styles.table, styles.subTable]}>
        <View style={styles.subHeader}>
          <Text style={[styles.cell, styles.assessment, styles.header]}>Writing</Text>
          <Text style={[styles.cell, styles.score, styles.header]}>Score</Text>
        </View>
        {writingRows.map((label) => (
          <View style={[styles.row, styles.blankRow]} key={label}>
            <Text style={[styles.cell, styles.assessment]}>{label}</Text>
            <Text style={[styles.cell, styles.score]} />
          </View>
        ))}
      </View>
    </Page>
  );
}

function DetailsPage({ data }: PageProps) {
  const getValue = (label: string, index: number) =>
    data.assessmentReport?.[labelToKey(label, index)] || "";

  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <View style={styles.pageTwoTable}>
        <View style={[styles.row, styles.shortRow]}>
          <Text style={[styles.cell, styles.largeLabel]}>14. Mathematics</Text>
          <Text style={[styles.cell, styles.assessment]}>{getValue("Mathematics", 13)}</Text>
        </View>
      </View>
      <View style={styles.pageTwoTable}>
        <View style={[styles.row, styles.shortRow]}>
          <Text style={[styles.cell, styles.largeLabel]}>Family History (if any)</Text>
          <Text style={[styles.cell, styles.assessment]}>{getValue("Family History (if any)", 14)}</Text>
        </View>
      </View>
      {([
        ["Presented Problem", 15],
        ["Identified Problem", 16],
        ["Remarks", 17],
      ] as const).map(([label, index]) => (
        <View style={styles.pageTwoTable} key={label}>
          <View style={styles.largeRow}>
            <Text style={styles.largeLabel}>{label}</Text>
            <Text style={[styles.assessment, { padding: 5 }]}>{getValue(label, index)}</Text>
          </View>
        </View>
      ))}
      <View style={styles.table}>
        <View style={[styles.row, styles.shortRow]}>
          <Text style={[styles.cell, styles.largeLabel]}>Assessed by</Text>
          <Text style={[styles.cell, styles.assessment]}>{getValue("Assessed by", 18)}</Text>
        </View>
        <View style={[styles.row, styles.shortRow]}>
          <Text style={[styles.cell, styles.largeLabel]}>Name & Signature</Text>
          <Text style={[styles.cell, styles.assessment]}>{getValue("Name & Signature", 19)}</Text>
        </View>
        <View style={[styles.row, styles.shortRow]}>
          <Text style={[styles.cell, styles.largeLabel]}>Date</Text>
          <Text style={[styles.cell, styles.assessment]}>{getValue("Date", 20)}</Text>
        </View>
      </View>
    </Page>
  );
}

export function AssessmentReportPdfPage({ data }: PageProps) {
  return (
    <>
      <AssessmentPage data={data} />
      <DetailsPage data={data} />
    </>
  );
}