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
  mentorNames: string[];
  pertemuan: MeetingRecord[];
};

export type StalledGroup = {
  id: string;
  name: string;
  mentorNames: string[];
  missedMeetings: number;
};

export type MeetingWarnings = {
  yellow: StalledGroup[];
  orange: StalledGroup[];
  red: StalledGroup[];
};

export function getMeetingWarnings(
  groups: GroupWithMeetings[],
  selectedWeek: number,
  currentWeek: number
): MeetingWarnings {
  const throughWeek = Math.min(selectedWeek, currentWeek);
  const warnings: MeetingWarnings = { yellow: [], orange: [], red: [] };

  for (const group of groups) {
    const meetingsByWeek = new Map(group.pertemuan.map((meeting) => [meeting.week, meeting]));
    let missedMeetings = 0;

    for (let week = 1; week <= throughWeek; week++) {
      const meeting = meetingsByWeek.get(week);

      if (week === currentWeek && (!meeting || statusForPertemuan(meeting) === "terjadwal")) {
        continue;
      }

      if (meeting?.status === "SELESAI") {
        missedMeetings = 0;
      } else {
        missedMeetings++;
      }
    }

    if (missedMeetings >= 4) {
      warnings.red.push({ ...group, missedMeetings });
    } else if (missedMeetings === 3) {
      warnings.orange.push({ ...group, missedMeetings });
    } else if (missedMeetings === 2) {
      warnings.yellow.push({ ...group, missedMeetings });
    }
  }

  return warnings;
}
