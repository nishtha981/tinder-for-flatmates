import { useEffect, useState } from "react";
import { getMatches, type Match } from "../api";
import Icon from "./Icon";

export default function Matches({
  onStartSwiping,
  onOpenChat,
}: {
  onStartSwiping: () => void;
  onOpenChat: (match: Match) => void;
}) {
  const [list, setList] = useState<Match[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getMatches().then(setList).catch((e: Error) => setError(e.message));
  }, []);

  if (!list) {
    return (
      <div className="mx-auto w-full max-w-sm px-5 py-16">
        <p className="card p-6 text-center text-sm font-semibold">
          {error ? `Couldn't load matches: ${error}` : "Loading matches…"}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your matches</h1>
          <p className="mt-1 text-sm text-ink/60">
            {list.length === 0
              ? "No matches yet — keep swiping!"
              : `${list.length} flatmate${list.length > 1 ? "s" : ""} liked you back.`}
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card mx-auto flex max-w-sm flex-col items-center p-8 text-center">
          <span className="icon-btn mb-4 h-16 w-16 bg-coral-tint">
            <Icon name="heart" size={28} className="text-coral" />
          </span>
          <p className="mb-5 text-sm text-ink/60">When someone you like likes you back, they show up here.</p>
          <button onClick={onStartSwiping} className="btn btn-coral w-full">
            Start swiping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((match) => {
            const m = match.profile;
            return (
              <button
                key={match.matchId}
                onClick={() => onOpenChat(match)}
                className="card group overflow-hidden text-left transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-brut-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <div className="aspect-square border-b-2 border-ink bg-violet-tint">
                  <img src={m.photos[0]} alt={m.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="font-bold">
                    {m.name}, {m.age}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
                    <Icon name="pin" size={12} /> {m.areas[0]}
                  </div>
                  <span className="mt-2.5 inline-flex items-center gap-1 rounded-full border-2 border-ink bg-violet px-2.5 py-0.5 text-xs font-bold text-white">
                    <Icon name="chat" size={12} /> Say hi
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
