import { statusForPertemuan } from "@/lib/status";

type MeetingRecord = {
  week: number;
  status: string;
  date: Date;
  time: string;
};

type GroupWithMeetings = {
  id: string;
  name: string;
  monitoringStartWeek?: number;
  mentorNames: string[];
  pertemuan: MeetingRecord[];
};

export type StalledGroup = {
  id: string;
  name: string;
  mentorNames: string[];
  missedMeetings: number;
  missedWeeks: number[];
};

export type MeetingWarnings = {
  early: StalledGroup[];
  yellow: StalledGroup[];
  orange: StalledGroup[];
  red: StalledGroup[];
};

function getMonitoringStartWeek(group: GroupWithMeetings) {
  const startWeek = group.monitoringStartWeek;
  return typeof startWeek === "number" && Number.isInteger(startWeek) && startWeek >= 1 ? startWeek : 1;
}

export function getMissedMeetingWeeks(
  group: GroupWithMeetings,
  selectedWeek: number,
  currentWeek: number
): number[] {
  const throughWeek = Math.min(selectedWeek, currentWeek - 1);
  const meetingsByWeek = new Map(group.pertemuan.map((meeting) => [meeting.week, meeting]));
  const missedWeeks: number[] = [];

  for (let week = getMonitoringStartWeek(group); week <= throughWeek; week++) {
    const meeting = meetingsByWeek.get(week);
    const status = statusForPertemuan(meeting);
    if (status === "belum_jadwal" || status === "belum_laksana") missedWeeks.push(week);
  }

  return missedWeeks;
}

export function getMeetingWarnings(
  groups: GroupWithMeetings[],
  selectedWeek: number,
  currentWeek: number
): MeetingWarnings {
  const warnings: MeetingWarnings = { early: [], yellow: [], orange: [], red: [] };

  for (const group of groups) {
    const meetingsByWeek = new Map(group.pertemuan.map((meeting) => [meeting.week, meeting]));
    let missedWeeks: number[] = [];
    const throughWeek = Math.min(selectedWeek, currentWeek - 1);
    for (let week = getMonitoringStartWeek(group); week <= throughWeek; week++) {
      const meeting = meetingsByWeek.get(week);
      const status = statusForPertemuan(meeting);
      if (status === "selesai") {
        missedWeeks = [];
      } else if (status === "belum_jadwal" || status === "belum_laksana") {
        missedWeeks.push(week);
      }
    }

    const missedMeetings = missedWeeks.length;
    const warning = { ...group, missedMeetings, missedWeeks };
    if (missedMeetings >= 4) {
      warnings.red.push(warning);
    } else if (missedMeetings === 3) {
      warnings.orange.push(warning);
    } else if (missedMeetings === 2) {
      warnings.yellow.push(warning);
    } else if (missedMeetings === 1) {
      warnings.early.push(warning);
    }
  }

  return warnings;
}
