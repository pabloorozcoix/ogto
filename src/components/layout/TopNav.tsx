"use client";
import { NavigationMenu } from "@/components/ui/NavigationMenu";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/agents", label: "Agents", icon: "🤖" },
  { href: "/runs", label: "Runs", icon: "⚡" },
  { href: "/tools", label: "Tools", icon: "🛠️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function TopNav() {
  return <NavigationMenu items={navItems} />;
}
