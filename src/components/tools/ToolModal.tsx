
import React from "react";
import { useTools } from "./hooks/useTools";
import type { TTool } from "./types";

export function ToolModal({ tool, onClose }: { tool: TTool; onClose: () => void }) {
  const { typeBadgeColor } = useTools();
  if (!tool) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-neutral-900 rounded-lg p-8 max-w-lg w-full border border-neutral-700 relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-2 right-2 text-neutral-400 hover:text-white text-2xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="text-xl font-bold mb-2 text-white">{tool.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded uppercase mb-2 inline-block ${typeBadgeColor(tool.type)}`}>{tool.type}</span>
        <div className="mb-4 text-neutral-300">{tool.longDesc || tool.desc}</div>
        <div className="mb-2">
          <span className="font-semibold text-neutral-200">When Used:</span>
          <span className="ml-2 text-neutral-300">{tool.when}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-neutral-200">Input:</span>
          <ul className="ml-2 text-neutral-300 list-disc list-inside">
            {tool.input && typeof tool.input === 'object'
              ? Object.entries(tool.input).map(([key, val]) => {
                  const v = val as { type: string; required?: boolean; desc?: string };
                  return (
                    <li key={key}>
                      <span className="font-mono text-blue-300">{key}</span>: <span className="font-mono text-xs">{v.type}</span>{v.required ? ' (required)' : ''} <span className="text-neutral-400">- {v.desc}</span>
                    </li>
                  );
                })
              : <li>{tool.input}</li>
            }
          </ul>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-neutral-200">Output:</span>
          <ul className="ml-2 text-neutral-300 list-disc list-inside">
            {tool.output && typeof tool.output === 'object'
              ? Object.entries(tool.output).map(([key, val]) => {
                  const v = val as { type: string; desc?: string };
                  return (
                    <li key={key}>
                      <span className="font-mono text-blue-300">{key}</span>: <span className="font-mono text-xs">{v.type}</span> <span className="text-neutral-400">- {v.desc}</span>
                    </li>
                  );
                })
              : <li>{tool.output}</li>
            }
          </ul>
        </div>
        <div className="flex flex-wrap gap-1 mt-4">
          {(tool.tags ? tool.tags.split(",") : []).map((tag: string) => (
            <span key={tag.trim()} className="text-xs bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">{tag.trim()}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
