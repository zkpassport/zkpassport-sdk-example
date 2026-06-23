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

/**
 * Left-hand scenario list: every option is visible at once and selectable in a
 * single click (no dropdown). Scenarios are grouped by proof mode in the order
 * they first appear in the list.
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
    <div className="flex w-full flex-col gap-4 sm:w-72">
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input
          type="checkbox"
          checked={devMode}
          onChange={(e) => onDevModeChange(e.target.checked)}
        />
        devMode {devMode ? "(mock passports · Sepolia)" : "(real passports · mainnet)"}
      </label>

      <div className="flex flex-col gap-4">
        {modes.map((mode) => (
          <div key={mode} className="flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {MODE_LABELS[mode] ?? mode}
            </p>
            {scenarios
              .filter((s) => s.mode === mode)
              .map((s) => {
                const active = s.id === selectedId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s)}
                    className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                      active
                        ? "border-blue-500 bg-blue-50 text-gray-900"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block font-medium">{s.label}</span>
                    <span className="mt-0.5 block text-[11px] text-gray-400">
                      {s.description}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
