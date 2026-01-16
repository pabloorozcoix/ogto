
import React from "react";

export function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin" />
    </div>
  );
}
