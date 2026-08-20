import {
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type { ApplicationPdfData } from "@/components/ApplicationPdf";

type PageProps = {
  data: ApplicationPdfData;
};

function labelToKey(label: string, index: number): string {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${index}`;
}

const BORDER = "#333333";
const SECTION_BG = "#F5F5F2";

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* ================= PAGE ================= */

  page: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 9,

    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },

  /* ================= MAIN TABLE ================= */

  exam: {
    width: "100%",

    borderWidth: 1,
    borderColor: BORDER,
  },

  /* ======================================================
     CLIENT NAME / DATE
  ====================================================== */

  clientRow: {
    flexDirection: "row",

    minHeight: 24,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  clientNameGroup: {
    width: "64%",

    flexDirection: "row",
    alignItems: "center",

    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  dateGroup: {
    width: "36%",

    flexDirection: "row",
    alignItems: "center",
  },

  clientLabel: {
    width: 105,

    paddingHorizontal: 7,

    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },

  clientValue: {
    flex: 1,

    paddingHorizontal: 6,

    fontSize: 9,
  },

  dateLabel: {
    width: 48,

    paddingHorizontal: 7,

    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },

  dateValue: {
    flex: 1,

    paddingHorizontal: 6,

    fontSize: 9,
  },

  /* ======================================================
     SECTION TITLE
  ====================================================== */

  sectionTitle: {
    minHeight: 23,

    justifyContent: "center",

    paddingHorizontal: 7,

    backgroundColor: SECTION_BG,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  sectionTitleText: {
    fontFamily: "Helvetica-Bold",

    fontSize: 10,
  },

  /* ======================================================
     NORMAL EXAM ROW
  ====================================================== */

  tableRow: {
    flexDirection: "row",

    minHeight: 23,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  labelCell: {
    width: "19%",

    justifyContent: "center",

    paddingHorizontal: 6,
    paddingVertical: 3,

    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  labelText: {
    fontSize: 8.5,
  },

  optionsCell: {
    width: "81%",

    flexDirection: "row",
    flexWrap: "wrap",

    alignItems: "center",

    paddingHorizontal: 5,
    paddingVertical: 4,
  },

  /* ======================================================
     CHECKBOX OPTION

     Do NOT use marginRight for alignment.

     Each option is placed inside a fixed-width column.
  ====================================================== */

  optionItem: {
    flexDirection: "row",

    alignItems: "center",

    paddingRight: 3,

    marginBottom: 1,
  },

  checkbox: {
    width: 6,
    height: 6,

    borderWidth: 0.7,
    borderColor: "#444444",

    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  checkmark: {
    width: 3.5,
    height: 2,
    borderLeftWidth: 0.8,
    borderBottomWidth: 0.8,
    borderColor: "#222222",
    transform: "rotate(-45deg)",
    marginTop: -1,
  },

  optionText: {
    fontSize: 8.2,
  },

  /* ======================================================
     COMMENTS
  ====================================================== */

  commentRow: {
    minHeight: 34,

    paddingTop: 5,
    paddingHorizontal: 7,

    flexDirection: "row",
    alignItems: "flex-start",

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  commentText: {
    fontSize: 8.5,
    flex: 1,
  },

  commentLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#000000",
    paddingHorizontal: 3,
    paddingVertical: 1.5,
    marginRight: 4,
  },

  /* ======================================================
     BEHAVIOR
  ====================================================== */

  behaviorRow: {
    flexDirection: "row",

    minHeight: 42,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  /* ======================================================
     INSIGHT / JUDGEMENT
  ====================================================== */

  bottomRow: {
    flexDirection: "row",

    minHeight: 28,

    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  bottomRowLast: {
    flexDirection: "row",

    minHeight: 28,
  },

  bottomLabel: {
    width: "20%",

    justifyContent: "center",

    paddingHorizontal: 7,

    borderRightWidth: 1,
    borderRightColor: BORDER,
  },

  bottomLabelText: {
    fontFamily: "Helvetica-Bold",

    fontSize: 9.5,
  },

  bottomContent: {
    width: "80%",

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 7,
  },

  bottomOptions: {
    width: "40%",

    flexDirection: "row",

    alignItems: "center",
  },

  commentsLabel: {
    fontSize: 8.5,

    marginLeft: 5,
  },

  commentsLine: {
    flex: 1,

    height: 13,

    marginLeft: 5,

    borderBottomWidth: 0.6,
    borderBottomColor: "#777777",
  },
});

/* =========================================================
   DATA TYPES
========================================================= */

type ExamRowData = {
  label: string;

  options: readonly string[];

  /*
   * Number of fixed checkbox columns.
   *
   * Observations = 5
   * Mood = 7
   * Behavior = 5 (wraps to second row)
   */
  columns: number;
};

type ExamSectionData = {
  title: string;
  rows: readonly ExamRowData[];
};

/* =========================================================
   EXAM DATA
========================================================= */

const sections: readonly ExamSectionData[] = [
  {
    title: "OBSERVATIONS",

    rows: [
      {
        label: "Appearance",

        columns: 5,

        options: [
          "Neat",
          "Dishevelled",
          "Inappropriate",
          "Bizarre",
          "Other",
        ],
      },

      {
        label: "Speech",

        columns: 5,

        options: [
          "Normal",
          "Tangential",
          "Pressured",
          "Impoverished",
          "Other",
        ],
      },

      {
        label: "Eye Contact",

        columns: 5,

        options: [
          "Normal",
          "Intense",
          "Avoidant",
          "Other",
        ],
      },

      {
        label: "Motor Activity",

        columns: 5,

        options: [
          "Normal",
          "Restless",
          "Tics",
          "Slowed",
          "Other",
        ],
      },

      {
        label: "Affect",

        columns: 5,

        options: [
          "Full",
          "Constricted",
          "Flat",
          "Labile",
          "Other",
        ],
      },
    ],
  },

  {
    title: "MOOD",

    rows: [
      {
        label: "",

        columns: 7,

        options: [
          "Euthymic",
          "Anxious",
          "Angry",
          "Depressed",
          "Euphoric",
          "Irritable",
          "Other",
        ],
      },
    ],
  },

  {
    title: "COGNITION",

    rows: [
      {
        label: "Orientation Impairment",

        columns: 5,

        options: [
          "None",
          "Place",
          "Object",
          "Person",
          "Time",
        ],
      },

      {
        label: "Memory Impairment",

        columns: 5,

        options: [
          "None",
          "Short-Term",
          "Long-Term",
          "Other",
        ],
      },

      {
        label: "Attention",

        columns: 5,

        options: [
          "Normal",
          "Distracted",
          "Other",
        ],
      },
    ],
  },

  {
    title: "PERCEPTION",

    rows: [
      {
        label: "Hallucinations",

        columns: 5,

        options: [
          "None",
          "Auditory",
          "Visual",
          "Other",
        ],
      },

      {
        label: "Other",

        columns: 5,

        options: [
          "None",
          "Derealization",
          "Depersonalization",
        ],
      },
    ],
  },

  {
    title: "THOUGHTS",

    rows: [
      {
        label: "Suicidality",

        columns: 5,

        options: [
          "None",
          "Ideation",
          "Plan",
          "Intent",
          "Self-Harm",
        ],
      },

      {
        label: "Homicidality",

        columns: 5,

        options: [
          "None",
          "Aggressive",
          "Intent",
          "Plan",
        ],
      },

      {
        label: "Delusions",

        columns: 5,

        options: [
          "None",
          "Grandiose",
          "Paranoid",
          "Religious",
          "Other",
        ],
      },
    ],
  },

  {
    title: "BEHAVIOR",

    rows: [
      {
        label: "",

        /*
         * Five columns.
         *
         * 10 options automatically become:
         *
         * Row 1 = 5
         * Row 2 = 5
         */
        columns: 5,

        options: [
          "Cooperative",
          "Guarded",
          "Hyperactive",
          "Agitated",
          "Paranoid",
          "Stereotyped",
          "Aggressive",
          "Bizarre",
          "Withdrawn",
          "Other",
        ],
      },
    ],
  },
];

/* =========================================================
   CHECKBOX OPTION
========================================================= */

function CheckOption({
  label,
  columns,
  checked = false,
}: {
  label: string;
  columns: number;
  checked?: boolean;
}) {
  const width = `${100 / columns}%`;
  return (
    <View style={[styles.optionItem, { width }]}>
      <View style={styles.checkbox}>
        {checked ? <View style={styles.checkmark} /> : null}
      </View>
      <Text style={styles.optionText}>{label}</Text>
    </View>
  );
}

/* =========================================================
   EXAM ROW
========================================================= */

function ExamRow({
  label,
  options,
  columns,
  behavior = false,
  checkedValues = [],
}: {
  label: string;
  options: readonly string[];
  columns: number;
  behavior?: boolean;
  checkedValues?: string[];
}) {
  return (
    <View style={behavior ? styles.behaviorRow : styles.tableRow} wrap={false}>
      <View style={styles.labelCell}>
        {label ? <Text style={styles.labelText}>{label}</Text> : null}
      </View>
      <View style={styles.optionsCell}>
        {options.map((option) => (
          <CheckOption
            key={option}
            label={option}
            columns={columns}
            checked={checkedValues.includes(option)}
          />
        ))}
      </View>
    </View>
  );
}

/* =========================================================
   COMMENTS ROW
========================================================= */


/* =========================================================
   EXAM SECTION
========================================================= */

const sectionKeyMap: Record<string, string> = {
  OBSERVATIONS: "observations",
  MOOD: "mood",
  COGNITION: "cognition",
  PERCEPTION: "perception",
  THOUGHTS: "thoughts",
  BEHAVIOR: "behavior",
};

function ExamSection({ section, mentalData }: { section: ExamSectionData; mentalData?: Record<string, any> }) {
  const isBehavior = section.title === "BEHAVIOR";
  const dataKey = sectionKeyMap[section.title] || "";
  const sectionData = mentalData?.[dataKey] as Record<string, string[]> | undefined;
  const comments = (mentalData?.[`${dataKey}_comments`] as string) || "";
const emptyLabelKey = section.title === "MOOD" ? "Mood" : "Behavior";
  return (
    <View wrap={false}>
      <View style={styles.sectionTitle}>
        <Text style={styles.sectionTitleText}>{section.title}</Text>
      </View>
      {section.rows.map(({ label, options, columns }, index) => (
        <ExamRow
          key={`${section.title}-${label}-${index}`}
          label={label}
          options={options}
          columns={columns}
          behavior={isBehavior}
          checkedValues={sectionData?.[label || emptyLabelKey] || []}
        />
      ))}
      <CommentsRow comment={comments} />
    </View>
  );
}

function CommentsRow({ comment }: { comment?: string }) {
  return (
    <View style={styles.commentRow} wrap={false}>
      <Text style={styles.commentLabel}>Comments:</Text>
      <Text style={styles.commentText}>{comment || ""}</Text>
    </View>
  );
}

/* =========================================================
   BOTTOM CHECKBOX
========================================================= */

function BottomCheckOption({
  label,
}: {
  label: string;
}) {
  return (
    <View
      style={[
        styles.optionItem,

        {
          width: "33.333%",
        },
      ]}
    >
      <View style={styles.checkbox} />

      <Text style={styles.optionText}>
        {label}
      </Text>
    </View>
  );
}

/* =========================================================
   INSIGHT / JUDGEMENT ROW
========================================================= */

function BottomRow({ title, last = false, rating = [], comment = "" }: {
  title: string; last?: boolean; rating?: string[]; comment?: string;
}) {
  return (
    <View style={last ? styles.bottomRowLast : styles.bottomRow} wrap={false}>
      <View style={styles.bottomLabel}>
        <Text style={styles.bottomLabelText}>{title}</Text>
      </View>
      <View style={styles.bottomContent}>
        <View style={styles.bottomOptions}>
          {["Good", "Fair", "Poor"].map((opt) => (
            <View key={opt} style={[styles.optionItem, { width: "33.333%" }]}>
              <View style={styles.checkbox}>
                {rating.includes(opt) ? <View style={styles.checkmark} /> : null}
              </View>
              <Text style={styles.optionText}>{opt}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.commentsLabel}>Comments:</Text>
        <View style={styles.commentsLine}>
          {comment ? <Text style={{ fontSize: 8 }}>{comment}</Text> : null}
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   MENTAL STATUS PDF PAGE
========================================================= */

export function MentalStatusPdfPage({ data }: PageProps) {
  const mentalData = data.mentalStatusExam || {};
  return (
    <Page size="A4" style={styles.page} wrap={false}>
      <View style={styles.exam}>
        <View style={styles.clientRow}>
          <View style={styles.clientNameGroup}>
            <Text style={styles.clientLabel}>Client Name</Text>
            <Text style={styles.clientValue}>{data.name || ""}</Text>
          </View>
          <View style={styles.dateGroup}>
            <Text style={styles.dateLabel}>Date</Text>
            <Text style={styles.dateValue}>{mentalData.exam_date || ""}</Text>
          </View>
        </View>

        {sections.map((section) => (
          <ExamSection key={section.title} section={section} mentalData={mentalData} />
        ))}

        <BottomRow title="INSIGHT" rating={mentalData.insight_rating || []} comment={mentalData.insight || ""} />
        <BottomRow title="JUDGEMENT" last rating={mentalData.judgement_rating || []} comment={mentalData.judgement || ""} />
      </View>
    </Page>
  );
}
