import * as React from "react";
import { cn } from "../../lib/utils";

import type {
  TTabsContentProps,
  TTabsInjectedProps,
  TTabsListProps,
  TTabsProps,
  TTabsTriggerProps,
} from "./types";

const Tabs = ({ value, onValueChange, children, className }: TTabsProps) => {
  return (
    <div className={cn("w-full", className)}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as React.ReactElement<TTabsInjectedProps>, {
          selectedValue: value,
          onSelect: onValueChange,
        });
      })}
    </div>
  );
};

const TabsList = ({ children, className, selectedValue, onSelect }: TTabsListProps) => (
  <div className={cn("flex border-b border-neutral-700", className)}>
    {React.Children.map(children, child => {
      if (!React.isValidElement(child)) return child;
      return React.cloneElement(child as React.ReactElement<TTabsInjectedProps>, {
        selectedValue,
        onSelect,
      });
    })}
  </div>
);

const TabsTrigger = ({ value, children, className, selectedValue, onSelect }: TTabsTriggerProps) => (
  <button
    type="button"
    className={cn(
      "px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-150 focus:outline-none",
      selectedValue === value
        ? "border-blue-600 text-blue-600 bg-neutral-800"
        : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-700",
      className
    )}
    onClick={() => onSelect && onSelect(value)}
  >
    {children}
  </button>
);

const TabsContent = ({ value, children, selectedValue, className }: TTabsContentProps) => {
  if (selectedValue !== value) return null;
  return <div className={cn("pt-4", className)}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
