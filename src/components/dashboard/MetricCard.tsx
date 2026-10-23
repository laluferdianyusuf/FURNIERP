import { MetricCardProps } from "@/src/types/dashboard";
import { Button } from "../ui/button";

export const MetricCard = ({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
  dotClassName,
  onClick,
}: MetricCardProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="
        h-auto min-w-0 flex-col items-stretch whitespace-normal
        rounded-xl border-[#E5E2DD] bg-[#FCFAF7] p-4
        text-left font-normal text-[#30251E] shadow-none
        transition-colors hover:border-[#CFC1B3] hover:bg-white
        focus-visible:ring-2 focus-visible:ring-[#795740]
      "
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="text-xs text-[#82746D]">{label}</span>

        <Icon
          aria-hidden="true"
          className={`size-5 shrink-0 text-[#82746D] ${iconClassName ?? ""}`}
        />
      </span>

      <span className="mt-4 block break-words text-xl font-semibold tracking-tight text-[#30251E]">
        {value}
      </span>

      <span className="mt-2 flex items-center gap-1.5 text-xs leading-5 text-[#82746D]">
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${
            dotClassName ?? "bg-[#5F402A]"
          }`}
        />

        {description}
      </span>
    </Button>
  );
};
