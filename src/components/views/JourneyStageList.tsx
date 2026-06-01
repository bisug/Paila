import { ChevronRight, MapPin, CheckCircle2, Circle, Mountain } from "lucide-react";
import {
  journeyStages,
  getActivitiesForStage,
  getLegForStage,
  type JourneyStage,
} from "@/lib/journey";
import { useVisitTracker } from "@/hooks/use-visit-tracker";

interface Props {
  activeStageId?: string | null;
  onPickStage?: (stage: JourneyStage) => void;
}

export function JourneyStageList({ activeStageId, onPickStage }: Props) {
  const { hasVisited } = useVisitTracker();

  return (
    <ol className="space-y-3">
      {journeyStages.map((stage, idx) => {
        const isLast = idx === journeyStages.length - 1;
        const visited = stage.spotId ? hasVisited(stage.spotId) : false;
        const active = stage.id === activeStageId;
        const leg = getLegForStage(stage);
        const activities = getActivitiesForStage(stage);

        return (
          <li key={stage.id} className="relative">
            {!isLast && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-9 bottom-[-18px] w-0.5 rounded-full ${
                  visited ? "bg-terracotta/60" : "bg-stone-200"
                }`}
              />
            )}
            <button
              type="button"
              onClick={() => onPickStage?.(stage)}
              className={`w-full text-left rounded-2xl border bg-white shadow-sm transition-colors ${
                active
                  ? "border-terracotta/40 ring-2 ring-terracotta/20"
                  : "border-stone-100 hover:border-stone-200"
              }`}
            >
              <div className="flex items-start gap-3 p-3">
                <span
                  className={`relative z-10 mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold shadow-sm ${
                    visited
                      ? "bg-terracotta text-white"
                      : active
                        ? "bg-pine text-white"
                        : "bg-white text-stone-500 border border-stone-200"
                  }`}
                >
                  {visited ? <CheckCircle2 size={14} /> : stage.order}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-pine">
                      Day {stage.day}
                    </p>
                    <span className="text-[10px] font-semibold text-stone-400">·</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-stone-500">
                      <Mountain size={10} className="text-stone-400" />
                      {stage.altitude}
                    </span>
                    {visited ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-terracotta/10 text-terracotta border border-terracotta/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        Visited
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-50 text-stone-500 border border-stone-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        <Circle size={8} /> Upcoming
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-bold text-stone-900 leading-snug">{stage.name}</p>
                  <p className="mt-1 text-xs text-stone-500 leading-snug">{stage.blurb}</p>

                  {leg && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-stone-50 border border-stone-100 px-2 py-1 text-[11px] text-stone-600">
                      <ChevronRight size={12} className="text-terracotta" />
                      <span className="font-semibold">{leg.operator}</span>
                      <span className="text-stone-400">·</span>
                      <span>{"duration" in leg ? leg.duration : `${leg.distanceKm} km trek`}</span>
                      <span className="text-stone-400">·</span>
                      <span className="font-bold text-stone-700">
                        {leg.price > 0 ? `${leg.price.toLocaleString()} ${leg.priceUnit}` : "Free"}
                      </span>
                    </div>
                  )}

                  {activities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activities.map((a) => (
                        <span
                          key={a.id}
                          className="inline-flex items-center gap-1 rounded-full bg-pine/10 text-pine border border-pine/20 px-2 py-0.5 text-[10px] font-semibold"
                        >
                          <MapPin size={9} />
                          {a.title.split(/[—·]/)[0].trim().slice(0, 32)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
