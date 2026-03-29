import { Badge } from "@/components/ui/badge";

const categoryColors: Record<string, string> = {
  Study:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0",
  Coding:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0",
  Health:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0",
  Career:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-0",
  Fitness:
    "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-0",
  Other:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0",
};

export default function CategoryBadge({ category }: { category: string }) {
  const cls = categoryColors[category] ?? categoryColors.Other;
  return (
    <Badge className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {category}
    </Badge>
  );
}
