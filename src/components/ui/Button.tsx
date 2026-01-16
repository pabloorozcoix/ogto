import * as React from "react";
import { cn } from "../../lib/utils";

import type { TButtonProps } from "./types";

const Button = React.forwardRef<HTMLButtonElement, TButtonProps>(
  ({ className, variant = "default", disabled, ...props }, ref) => {
    const base =
      "w-full py-3 rounded font-bold text-lg transition-colors duration-150";
    const variants = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      disabled:
        "bg-neutral-700 text-neutral-400 cursor-not-allowed",
    };

    const isDisabled = disabled || variant === "disabled";
    return (
      <button
        ref={ref}
        className={cn(
          base,
          isDisabled ? variants.disabled : variants.default,
          className
        )}
        disabled={isDisabled}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
