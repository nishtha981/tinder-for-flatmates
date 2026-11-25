import { useState } from "react";
import { motion } from "framer-motion";
import { defaultFilters } from "../lib/filtering";
import type { Area, DiscoverFilters, Gender, Profile } from "../types";
import Icon from "./Icon";

const GENDERS: Gender[] = ["Female", "Male", "Non-binary"];

export default function FilterSheet({
  me,
  current,
  onApply,
  onClose,
}: {
  me: Profile;
  current: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
  onClose: () => void;
}) {
  const [genders, setGenders] = useState<Gender[]>(current.genders);
  const [areas, setAreas] = useState<Area[]>(current.areas);
  const [budgetMin, setBudgetMin] = useState(current.budgetMin);
  const [budgetMax, setBudgetMax] = useState(current.budgetMax);

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  function apply() {
    onApply({
      genders,
      areas,
      budgetMin: Math.min(budgetMin, budgetMax),
      budgetMax: Math.max(budgetMin, budgetMax),
    });
  }

  function reset() {
    const d = defaultFilters(me);
    setGenders(d.genders);
    setAreas(d.areas);
    setBudgetMin(d.budgetMin);
    setBudgetMax(d.budgetMax);
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border-2 border-b-0 border-ink bg-white md:rounded-3xl md:border-b-2 md:shadow-brut-lg"
      >
        <div className="bar flex items-center justify-between px-5 py-4">
          <h2 className="text-xl font-bold">Filters</h2>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="btn-ghost text-sm">Reset</button>
            <button onClick={onClose} className="icon-btn h-9 w-9" aria-label="Close filters">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto p-5">
          <section>
            <h3 className="label">Gender</h3>
            <div className="flex flex-wrap items-center gap-2">
              {GENDERS.map((g) => (
                <Chip key={g} active={genders.includes(g)} onClick={() => setGenders((l) => toggle(l, g))}>
                  {g}
                </Chip>
              ))}
              {genders.length === 0 && <span className="text-xs font-semibold text-ink/50">Showing everyone</span>}
            </div>
          </section>

          <section>
            <h3 className="label">Budget · {inr(budgetMin)} – {inr(budgetMax)} / month</h3>
            <span className="text-xs font-semibold text-ink/50">Minimum</span>
            <input type="range" min={5000} max={60000} step={1000} value={budgetMin} onChange={(e) => setBudgetMin(Number(e.target.value))} className="mb-4 mt-2" />
            <span className="text-xs font-semibold text-ink/50">Maximum</span>
            <input type="range" min={5000} max={60000} step={1000} value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} className="mt-2" />
          </section>

          <section>
            <h3 className="label">Areas</h3>
            <div className="flex flex-wrap items-center gap-2">
              {me.areas.map((a) => (
                <Chip key={a} active={areas.includes(a)} onClick={() => setAreas((l) => toggle(l, a))}>
                  {a}
                </Chip>
              ))}
              {areas.length === 0 && <span className="text-xs font-semibold text-ink/50">All your areas</span>}
            </div>
          </section>
        </div>

        <div className="border-t-2 border-ink p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button onClick={apply} className="btn btn-coral w-full">
            Show flatmates
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={`chip ${active ? "chip-on" : "hover:bg-violet-tint"}`}>
      {children}
    </button>
  );
}
