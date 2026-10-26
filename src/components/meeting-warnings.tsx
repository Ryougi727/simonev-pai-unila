import type { MeetingWarnings, StalledGroup } from "@/lib/meeting-warnings";

const severityStyles = {
  early: {
    title: "Peringatan Dini",
    classes: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  yellow: {
    title: "Peringatan 1",
    classes: "border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  },
  orange: {
    title: "Peringatan 2",
    classes: "border-orange-300 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  },
  red: {
    title: "Peringatan 3",
    classes: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  },
} as const;

function WarningList({ groups }: { groups: StalledGroup[] }) {
  if (!groups.length) {
    return <p className="mt-3 text-xs opacity-75">Tidak ada kelompok.</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {groups.map((group) => (
        <li key={group.id} className="border-t border-current/15 pt-2 first:border-0 first:pt-0">
          <div className="text-sm font-semibold">{group.name}</div>
          <div className="text-xs opacity-80">
            Mentor: {group.mentorNames.length ? group.mentorNames.join(", ") : "Belum ditentukan"}
          </div>
          <div className="text-xs opacity-80">{group.missedMeetings} pertemuan berturut-turut belum terlaksana</div>
          <div className="text-xs opacity-80">Minggu: {group.missedWeeks.join(", ")}</div>
        </li>
      ))}
    </ul>
  );
}

export function MeetingWarningsSection({ warnings }: { warnings: MeetingWarnings }) {
  return (
    <section aria-label="Peringatan kelompok macet" className="mt-6 mb-4">
      <h2 className="mb-2 text-sm font-bold text-on-surface">Peringatan Kelompok Macet</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(severityStyles) as Array<keyof MeetingWarnings>).map((severity) => {
          const groups = warnings[severity];
          const style = severityStyles[severity];

          return (
            <div key={severity} className={`rounded-2xl border p-4 ${style.classes}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{style.title}</h3>
                <span className="rounded-full bg-white/60 px-2.5 py-1 text-xs font-bold dark:bg-black/20">
                  {groups.length} kelompok
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {severity === "early" ? "1" : severity === "yellow" ? "2" : severity === "orange" ? "3" : "4 atau lebih"} pertemuan berturut-turut belum terlaksana
              </p>
              <WarningList groups={groups} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
