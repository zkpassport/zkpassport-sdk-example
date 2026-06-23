"use client";
import type { Scenario } from "../test-scenarios";

const MODE_LABELS: Record<string, string> = {
  fast: "Fast",
  compressed: "Compressed",
  "compressed-evm": "EVM (on-chain)",
};

type Props = {
  scenarios: Scenario[];
  selectedId: string;
  onSelect: (scenario: Scenario) => void;
  devMode: boolean;
  onDevModeChange: (value: boolean) => void;
};

// Labels are prefixed with the mode (e.g. "Fast · …"), which is redundant once
// grouped under a mode heading — drop the first segment for display.
const shortLabel = (label: string) => {
  const parts = label.split(" · ");
  return parts.length > 1 ? parts.slice(1).join(" · ") : label;
};

/**
 * Left-hand scenario list: every option is visible at once and selectable in a
 * single click (no dropdown). Compact one-line rows separated by dividers and
 * grouped by proof mode; the full description shows on hover.
 */
export function ScenarioPicker({
  scenarios,
  selectedId,
  onSelect,
  devMode,
  onDevModeChange,
}: Props) {
  // Preserve first-seen order of modes so groups render predictably.
  const modes = scenarios.reduce<string[]>((acc, s) => {
    if (!acc.includes(s.mode)) acc.push(s.mode);
    return acc;
  }, []);

  return (
    <div className="flex w-full flex-col gap-4 sm:w-96">
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={devMode}
          onChange={(e) => onDevModeChange(e.target.checked)}
        />
        devMode {devMode ? "(Sepolia)" : "(mainnet)"}
      </label>

      <div className="flex flex-col gap-4">
        {modes.map((mode) => (
          <div key={mode}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {MODE_LABELS[mode] ?? mode}
            </p>
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {scenarios
                .filter((s) => s.mode === mode)
                .map((s) => {
                  const active = s.id === selectedId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      title={s.description}
                      onClick={() => onSelect(s)}
                      className={`block w-full truncate px-2 py-1.5 text-left text-xs transition-colors ${
                        active
                          ? "bg-blue-50 font-medium text-blue-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {shortLabel(s.label)}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
