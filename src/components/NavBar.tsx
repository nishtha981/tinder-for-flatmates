import Icon, { type IconName } from "./Icon";

export type Tab = "discover" | "matches" | "profile";

const ITEMS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "matches", label: "Matches", icon: "chat" },
  { id: "discover", label: "Discover", icon: "flame" },
  { id: "profile", label: "Profile", icon: "user" },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-2 -top-1.5 h-5 min-w-5 rounded-full border-2 border-ink bg-coral px-1 text-[10px] font-bold leading-4 text-white">
      {count}
    </span>
  );
}

/** Phone: bottom bar with a raised centre "Discover" button. Hidden from md up. */
export default function NavBar({
  tab,
  onChange,
  matchCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  matchCount: number;
}) {
  return (
    <nav className="sticky bottom-0 z-20 border-t-2 border-ink bg-violet-tint pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto flex max-w-md items-end justify-around px-6">
        {ITEMS.map((it) =>
          it.id === "discover" ? (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              aria-label={it.label}
              aria-current={tab === it.id ? "page" : undefined}
              className={`-mt-7 mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink shadow-brut transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                tab === it.id ? "bg-coral text-white" : "bg-white text-ink"
              }`}
            >
              <Icon name={it.icon} size={28} />
            </button>
          ) : (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              aria-current={tab === it.id ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold ${
                tab === it.id ? "text-violet" : "text-ink/50"
              }`}
            >
              <span className="relative">
                <Icon name={it.icon} size={22} />
                {it.id === "matches" && <Badge count={matchCount} />}
              </span>
              {it.label}
            </button>
          )
        )}
      </div>
    </nav>
  );
}

/** Desktop: tabs in the header. Hidden below md. */
export function NavTabs({
  tab,
  onChange,
  matchCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  matchCount: number;
}) {
  const order: Tab[] = ["discover", "matches", "profile"];
  return (
    <div className="hidden items-center gap-2 md:flex">
      {order.map((id) => {
        const it = ITEMS.find((i) => i.id === id)!;
        const active = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${
              active ? "border-ink bg-violet text-white shadow-brut-sm" : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            <Icon name={it.icon} size={18} />
            {it.label}
            {id === "matches" && <Badge count={matchCount} />}
          </button>
        );
      })}
    </div>
  );
}
