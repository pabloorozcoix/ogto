import * as React from "react"
import { cn } from "../../lib/utils"

import type { TSliderProps } from "./types";

export type { TSliderProps } from "./types";

const Slider = React.forwardRef<HTMLInputElement, TSliderProps>(({ className, min = 0, max = 100, step = 1, ...props }, ref) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      className={cn(
        "w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-ring [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Slider.displayName = "Slider"

export { Slider };
