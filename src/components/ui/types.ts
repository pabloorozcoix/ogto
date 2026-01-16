import * as React from "react";

export type TInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export type TSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export type TTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export type TCardProps = React.HTMLAttributes<HTMLDivElement>;

export type TButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "disabled";
};

export type TTabsInjectedProps = {
  selectedValue?: string;
  onSelect?: (value: string) => void;
};

export type TTabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export type TTabsListProps = {
  children: React.ReactNode;
  className?: string;
  selectedValue?: string;
  onSelect?: (value: string) => void;
};

export type TTabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  selectedValue?: string;
  onSelect?: (value: string) => void;
};

export type TTabsContentProps = {
  value: string;
  children: React.ReactNode;
  selectedValue?: string;
  className?: string;
};

export type TNavigationMenuItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export type TNavigationMenuProps = {
  items: TNavigationMenuItem[];
};

export type TSliderProps = React.InputHTMLAttributes<HTMLInputElement> & {
  min?: number;
  max?: number;
  step?: number;
};
