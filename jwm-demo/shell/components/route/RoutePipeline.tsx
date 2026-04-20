/**
 * RoutePipeline — horizontal step viz for a JWM Route.
 *
 * Props:
 *   steps      — RouteStep[] (main + branch)
 *   variant    — "full" | "compact"
 *   onStepClick— optional click handler for editor interactivity
 *
 * Renders the main sequence left-to-right. Side-branches (is_optional=1 or
 * branch_from_step>0) are rendered as vertical drop-downs under the source
 * step. Colors follow the demo convention (see lib/routes.ts:stepColor).
 */
"use client";

import { CheckCircle2, Clock, Circle, AlertTriangle, SkipForward } from "lucide-react";
import { partitionSteps, stepColor, type RouteStep } from "@/lib/routes";

type Variant = "full" | "compact";

export interface RoutePipelineProps {
  steps: RouteStep[];
  variant?: Variant;
  onStepClick?: (step: RouteStep) => void;
  className?: string;
}

function StatusIcon({ status, size = 18 }: { status: RouteStep["status"]; size?: number }) {
  const common = { size, strokeWidth: 2.2 };
  switch (status) {
    case "Complete":    return <CheckCircle2 {...common} />;
    case "In Progress": return <Clock         {...common} />;
    case "Pending":     return <Circle        {...common} />;
    case "Skipped":     return <SkipForward   {...common} />;
    case "NCR Loopback":return <AlertTriangle {...common} />;
  }
}

function StepNode({
  step,
  variant,
  onClick,
}: {
  step: RouteStep;
  variant: Variant;
  onClick?: () => void;
}) {
  const color = stepColor(step.status);
  const nodeSize = variant === "compact" ? "w-9 h-9" : "w-12 h-12";
  const textSize = variant === "compact" ? "text-[10px]" : "text-xs";
  const opSize = variant === "compact" ? "text-[11px]" : "text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 group shrink-0 focus:outline-none"
      aria-label={`${step.operation} - ${step.status}`}
    >
      <div
        className={`${nodeSize} rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white group-hover:ring-offset-2 group-focus-visible:ring-2 group-focus-visible:ring-sky-400 transition`}
        style={{ backgroundColor: color }}
      >
        <StatusIcon status={step.status} size={variant === "compact" ? 14 : 18} />
      </div>
      <div className={`${textSize} font-semibold text-slate-700`}>#{step.step_no}</div>
      <div
        className={`${opSize} font-medium text-slate-900 text-center max-w-[90px] leading-tight`}
        title={`${step.operation} @ ${step.workstation}`}
      >
        {step.operation}
      </div>
      {variant === "full" && (
        <div className="text-[10px] text-slate-500 text-center">{step.workstation}</div>
      )}
    </button>
  );
}

function Connector({ color = "#cbd5e1", width = "w-10" }: { color?: string; width?: string }) {
  return (
    <div
      className={`${width} h-[3px] shrink-0 rounded self-center`}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function RoutePipeline({ steps, variant = "full", onStepClick, className = "" }: RoutePipelineProps) {
  const { main, branches } = partitionSteps(steps);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="flex items-start gap-0 px-2 py-4 min-w-max">
        {main.map((s, i) => {
          const stepBranch = branches.find((b) => b.branch_from_step === s.step_no);
          return (
            <div key={s.name || `${s.step_no}-${s.operation}`} className="flex items-start">
              <div className="flex flex-col items-center">
                <StepNode step={s} variant={variant} onClick={onStepClick ? () => onStepClick(s) : undefined} />
                {stepBranch && (
                  <div className="flex flex-col items-center mt-2">
                    <div className="w-[3px] h-5 rounded" style={{ backgroundColor: stepColor(stepBranch.status) }} aria-hidden />
                    <StepNode step={stepBranch} variant={variant} onClick={onStepClick ? () => onStepClick(stepBranch) : undefined} />
                    <div className="text-[9px] uppercase tracking-wide text-red-600 font-semibold mt-1">
                      NCR Branch
                    </div>
                  </div>
                )}
              </div>
              {i < main.length - 1 && (
                <Connector
                  color={main[i].status === "Complete" ? "#10b981" : "#cbd5e1"}
                  width={variant === "compact" ? "w-6" : "w-10"}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoutePipeline;
