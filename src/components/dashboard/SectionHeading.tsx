import { SectionHeadingProps } from "@/src/types/dashboard";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { CardTitle } from "../ui/card";

export const SectionHeading = ({
  title,
  action,
  onAction,
}: SectionHeadingProps) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <CardTitle className="text-sm font-semibold text-[#30251E]">
        {title}
      </CardTitle>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAction}
        className="
          h-auto shrink-0 gap-1 px-1 py-1 text-xs font-medium
          text-[#795740] hover:bg-transparent hover:text-[#5F402A]
        "
      >
        {action}

        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
};
