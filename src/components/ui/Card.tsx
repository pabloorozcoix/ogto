import * as React from "react";
import { cn } from "../../lib/utils";

import type { TCardProps } from "./types";

export type { TCardProps } from "./types";

const Card = React.forwardRef<HTMLDivElement, TCardProps>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-neutral-900 rounded-lg p-6 border border-neutral-800 shadow-sm",
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

export { Card };
