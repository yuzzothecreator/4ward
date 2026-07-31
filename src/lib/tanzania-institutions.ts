/**
 * Tanzania universities & institutes (TCU + common NACTE institutes).
 * Canonical stored value is the short code (e.g. "UDSM") when available.
 */

export type TanzaniaInstitution = {
  /** Short code shown in UI (UDSM, SUA, DIT…) */
  short: string;
  /** Full official name */
  name: string;
  kind: "university" | "college" | "institute";
};

export const TANZANIA_INSTITUTIONS: TanzaniaInstitution[] = [
  // ── Public universities ──
  { short: "UDSM", name: "University of Dar es Salaam", kind: "university" },
  { short: "UDOM", name: "University of Dodoma", kind: "university" },
  { short: "OUT", name: "The Open University of Tanzania", kind: "university" },
  { short: "ARU", name: "Ardhi University", kind: "university" },
  { short: "SUZA", name: "State University of Zanzibar", kind: "university" },
  { short: "MU", name: "Mzumbe University", kind: "university" },
  { short: "SUA", name: "Sokoine University of Agriculture", kind: "university" },
  { short: "MUHAS", name: "Muhimbili University of Health and Allied Sciences", kind: "university" },
  { short: "NM-AIST", name: "Nelson Mandela African Institution of Science and Technology", kind: "university" },
  { short: "MUST", name: "Mbeya University of Science and Technology", kind: "university" },
  { short: "MoCU", name: "Moshi Co-operative University", kind: "university" },
  { short: "MJNUAT", name: "Mwalimu Julius K. Nyerere University of Agriculture and Technology", kind: "university" },
  { short: "KUA", name: "Katavi University of Agriculture", kind: "university" },
  { short: "IITM-ZNZ", name: "IIT Madras Zanzibar", kind: "university" },

  // ── Private universities ──
  { short: "HKMU", name: "Hubert Kairuki Memorial University", kind: "university" },
  { short: "IMTU", name: "International Medical and Technological University", kind: "university" },
  { short: "TUMA", name: "Tumaini University Makumira", kind: "university" },
  { short: "SAUT", name: "St. Augustine University of Tanzania", kind: "university" },
  { short: "ZU", name: "Zanzibar University", kind: "university" },
  { short: "MMU", name: "Mount Meru University", kind: "university" },
  { short: "UoA", name: "University of Arusha", kind: "university" },
  { short: "TEKU", name: "Teofilo Kisanji University", kind: "university" },
  { short: "MUM", name: "Muslim University of Morogoro", kind: "university" },
  { short: "SJUT", name: "St. John's University of Tanzania", kind: "university" },
  { short: "CUHAS", name: "Catholic University of Health and Allied Sciences", kind: "university" },
  { short: "SJUIT", name: "St. Joseph University in Tanzania", kind: "university" },
  { short: "UAUT", name: "United African University of Tanzania", kind: "university" },
  { short: "SEKOMU", name: "Sebastian Kolowa Memorial University", kind: "university" },
  { short: "UoI", name: "University of Iringa", kind: "university" },
  { short: "AKU", name: "Aga Khan University", kind: "university" },
  { short: "MWECAU", name: "Mwenge Catholic University", kind: "university" },
  { short: "KIUT", name: "Kampala International University in Tanzania", kind: "university" },
  { short: "RUCU", name: "Ruaha Catholic University", kind: "university" },
  { short: "CUoM", name: "Catholic University of Mbeya", kind: "university" },
  { short: "DarTU", name: "Dar es Salaam Tumaini University", kind: "university" },
  { short: "ETU", name: "Eckernforde Tanga University", kind: "university" },
  { short: "UB", name: "University of Bagamoyo", kind: "university" },
  { short: "TIU", name: "Tanzania International University", kind: "university" },
  { short: "UMST", name: "University of Medical Sciences and Technology", kind: "university" },

  // ── University colleges / campuses ──
  { short: "DUCE", name: "Dar es Salaam University College of Education", kind: "college" },
  { short: "MUCE", name: "Mkwawa University College of Education", kind: "college" },
  { short: "MNMA", name: "Mwalimu Nyerere Memorial Academy", kind: "college" },
  { short: "UCEZ", name: "University College of Education Zanzibar", kind: "college" },
  { short: "MU-DSM", name: "Mzumbe University — Dar es Salaam Campus College", kind: "college" },
  { short: "MU-MBY", name: "Mzumbe University — Mbeya Campus College", kind: "college" },
  { short: "KCMUCo", name: "Kilimanjaro Christian Medical University College", kind: "college" },
  { short: "SFUCHAS", name: "St. Francis University College of Health and Allied Sciences", kind: "college" },
  { short: "STEMMUCo", name: "Stella Maris Mtwara University College", kind: "college" },
  { short: "SMMUCo", name: "Stefano Moshi Memorial University College", kind: "college" },
  { short: "AMCET", name: "Al-Maktoum College of Engineering and Technology", kind: "college" },
  { short: "KIU-DAR", name: "Kampala International University Dar es Salaam College", kind: "college" },

  // ── Popular institutes (NACTE / specialised) ──
  { short: "DIT", name: "Dar es Salaam Institute of Technology", kind: "institute" },
  { short: "NIT", name: "National Institute of Transport", kind: "institute" },
  { short: "IFM", name: "Institute of Finance Management", kind: "institute" },
  { short: "CBE", name: "College of Business Education", kind: "institute" },
  { short: "TIA", name: "Tanzania Institute of Accountancy", kind: "institute" },
  { short: "IAA", name: "Institute of Accountancy Arusha", kind: "institute" },
  { short: "IRDP", name: "Institute of Rural Development Planning", kind: "institute" },
  { short: "IAS", name: "Institute of Adult Education", kind: "institute" },
  { short: "IMS", name: "Institute of Marine Sciences", kind: "institute" },
  { short: "KICoB", name: "Kizumbi Institute of Cooperative Business Education", kind: "institute" },
  { short: "ATCL", name: "Arusha Technical College", kind: "institute" },
  { short: "MIST", name: "Mbeya Institute of Science and Technology", kind: "institute" },
];

/** Dropdown option label: short + full name */
export function institutionOptionLabel(inst: TanzaniaInstitution) {
  return `${inst.short} — ${inst.name}`;
}

/** Compact display (cards, meta rows): prefer short code */
export function institutionShort(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const found = resolveInstitution(value);
  return found?.short || value.trim();
}

/** Longer display when space allows */
export function institutionLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const found = resolveInstitution(value);
  if (!found) return value.trim();
  return `${found.short} — ${found.name}`;
}

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");
}

/** Map free-text or legacy full names → canonical short code */
export function canonicalizeInstitution(
  value: string | null | undefined
): string {
  if (!value?.trim()) return "";
  const found = resolveInstitution(value);
  return found?.short || value.trim();
}

export function resolveInstitution(
  value: string | null | undefined
): TanzaniaInstitution | undefined {
  if (!value?.trim()) return undefined;
  const n = norm(value);

  const byShort = TANZANIA_INSTITUTIONS.find((i) => norm(i.short) === n);
  if (byShort) return byShort;

  const byName = TANZANIA_INSTITUTIONS.find((i) => norm(i.name) === n);
  if (byName) return byName;

  // Loose contains for legacy phrases like "University of Dar es Salaam (UDSM)"
  const loose = TANZANIA_INSTITUTIONS.find(
    (i) =>
      n.includes(norm(i.short)) ||
      n.includes(norm(i.name)) ||
      norm(i.name).includes(n)
  );
  return loose;
}

export const INSTITUTION_KINDS = [
  { id: "university" as const, label: "Universities" },
  { id: "college" as const, label: "University colleges" },
  { id: "institute" as const, label: "Institutes" },
];
