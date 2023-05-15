import type { ParamsObject } from "sql.js";
import type { Grades, Season } from "../types/Grades";

function getTotalStudents(row: ParamsObject): number {
  const grades = [
    row["aPlus"],
    row["a"],
    row["aMinus"],
    row["bPlus"],
    row["b"],
    row["bMinus"],
    row["cPlus"],
    row["c"],
    row["cMinus"],
    row["dPlus"],
    row["d"],
    row["dMinus"],
    row["cr"],
    row["nc"],
    row["p"],
    row["w"],
    row["i"],
    row["nf"],
  ] as number[];

  return grades.reduce((acc, x) => acc + x, 0);
}

export function rowToGrades(row: ParamsObject): Grades | null {
  if (row["gradesId"] === undefined) return null;

  const [instructor1First, instructor1Last] = splitName(row["instructor1"] as string); // FIXME (no professor)

  const [season, year] = parseSemester(row["semester"] as string);

  return {
    id: row["gradesId"] as number,
    semester: {
      season,
      year,
    },
    subject: row["subject"] as string,
    catalogNumber: row["catalogNumber"] as string,
    section: row["section"] as string,
    aPlus: row["aPlus"] as number,
    a: row["a"] as number,
    aMinus: row["aMinus"] as number,
    bPlus: row["bPlus"] as number,
    b: row["b"] as number,
    bMinus: row["bMinus"] as number,
    cPlus: row["cPlus"] as number,
    c: row["c"] as number,
    cMinus: row["cMinus"] as number,
    dPlus: row["dPlus"] as number,
    d: row["d"] as number,
    dMinus: row["dMinus"] as number,
    f: row["f"] as number,
    cr: row["cr"] as number,
    nc: row["nc"] as number,
    p: row["p"] as number,
    w: row["w"] as number,
    i: row["i"] as number,
    nf: row["nf"] as number,
    instructor1: {
      first: instructor1First,
      last: instructor1Last,
    },
    // TODO (more professors)
    instructor2: null,
    instructor3: null,
    instructor4: null,
    instructor5: null,
    instructor6: null,
    totalStudents: getTotalStudents(row),
  };
}

export function parseSeason(s: string): Season {
  if (s !== "Spring" && s !== "Summer" && s !== "Fall") {
    throw new Error(`"${s}" is not a season.`);
  }
  return s;
}

export function parseSemester(semester: string): [season: Season, year: number] {
  const [season, year] = semester.split(" ");
  if (!season || !year) {
    throw new Error(`Invalid semester name: ${semester}`);
  }
  return [parseSeason(season), parseInt(year)];
}

export const SEASONS: Record<Season, number> = {
  Spring: 0,
  Summer: 1,
  Fall: 2,
};

export function createWhereString(search: string): string {
  /*
  subject: 'CS' should match 'CS' but not 'HCS'
  courseSection: '33' should match '3377' but not '1336'
  semester: '20', '18', '2018', 'Fall' should all match 'Fall 2018'
  instructor1: 'John', 'Cole' should match 'John Cole'. 'Ali' should match 'Alice' but not 'Salisbury'

  Split into tokens: first on whitespace, then on other criteria
  The regex matches all courses.sec (####.xxx) strings, standalone numbers, and standalone non-numeric words
   */

  const tokens = search
    .split(/\s/)
    .flatMap((x) => Array.from(x.matchAll(/\d{4}\.\S*|\d+|\D+/g), (m) => m[0]));

  return tokens
    .map(
      (s) => `(
      subject LIKE '${s}%' OR
      courseSection LIKE '${s}%' OR
      semester LIKE '%${s}%' OR
      instructor1 LIKE '${s}%' OR
      instructor1 LIKE '% ${s}%'
    )`
    )
    .join(" AND ");
}

export function splitName(name: string): [first: string, last: string] {
  const space = name.lastIndexOf(" ");
  return [name.substring(0, space), name.substring(space + 1)];
}
