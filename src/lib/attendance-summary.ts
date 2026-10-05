type Praktikan = { id: string; name: string; npm: string };
type Attendance = { praktikanId: string; status: string };

export function summarizeAbsence(praktikan: Praktikan[], attendance: Attendance[]) {
  const statusByPraktikan = new Map(attendance.map((entry) => [entry.praktikanId, entry.status]));
  const summary = { izin: [] as string[], sakit: [] as string[], tanpaKeterangan: [] as string[] };

  for (const person of praktikan) {
    const identity = `${person.name} (${person.npm})`;
    switch (statusByPraktikan.get(person.id)) {
      case "HADIR":
        break;
      case "IZIN":
        summary.izin.push(identity);
        break;
      case "SAKIT":
        summary.sakit.push(identity);
        break;
      default:
        summary.tanpaKeterangan.push(identity);
        break;
    }
  }

  return summary;
}
