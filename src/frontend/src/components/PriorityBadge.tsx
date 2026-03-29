import { Badge } from "@/components/ui/badge";

const priorityConfig: Record<string, { label: string; className: string }> = {
  High: {
    label: "High",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0",
  },
  Medium: {
    label: "Medium",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0",
  },
  Low: {
    label: "Low",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
  },
};

export default function PriorityBadge({ priority }: { priority: string }) {
  const cfg = priorityConfig[priority] ?? { label: priority, className: "" };
  return (
    <Badge
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
}
