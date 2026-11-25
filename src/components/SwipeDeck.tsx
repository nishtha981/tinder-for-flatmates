import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getDeck, recordSwipe, type Match } from "../api";
import { filterCandidates } from "../lib/filtering";
import type { DiscoverFilters, Profile, SwipeDirection } from "../types";
import SwipeCard from "./SwipeCard";
import Icon from "./Icon";

export default function SwipeDeck({
  me,
  filters,
  onMatch,
}: {
  me: Profile;
  filters: DiscoverFilters;
  onMatch: (match: Match) => void;
}) {
  // The server returns everyone whose budget AND area overlap yours; the softer filters apply here.
  const [deck, setDeck] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getDeck()
      .then((candidates) => setDeck(filterCandidates(me, candidates, filters)))
      .catch((e: Error) => setError(e.message));
    // The deck is remounted (keyed) when the profile or filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);

  function swipe(dir: SwipeDirection) {
    const current = deck?.[index];
    if (!current) return;
    setIndex((i) => i + 1);
    recordSwipe(current.id, dir)
      .then(({ match }) => match && onMatch(match))
      .catch((e: Error) => setError(e.message));
  }

  if (error || !deck) {
    return (
      <div className="mx-auto w-full max-w-sm px-5 py-16">
        <div className="card p-6 text-center text-sm font-semibold">
          {error ? `Something went wrong: ${error}` : "Finding flatmates…"}
        </div>
      </div>
    );
  }

  const remaining = deck.slice(index, index + 2).reverse();
  const done = index >= deck.length;

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-5 sm:py-8 md:max-w-[26rem]">
      <div className="relative mx-auto aspect-[3/4] w-full max-h-[62vh] sm:max-h-none">
        {done ? (
          <EmptyState />
        ) : (
          <AnimatePresence>
            {remaining.map((profile, i) => {
              const isTop = i === remaining.length - 1;
              return (
                <motion.div
                  key={profile.id}
                  className="absolute inset-0"
                  initial={{ scale: 0.95, y: 14 }}
                  animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 14 }}
                  exit={{ opacity: 0 }}
                  style={{ zIndex: i }}
                >
                  {isTop ? (
                    <SwipeCard profile={profile} onSwipe={swipe} />
                  ) : (
                    <div className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-ink bg-violet-tint shadow-brut">
                      <img src={profile.photos[0]} alt="" className="h-full w-full object-cover opacity-80" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {!done && (
        <div className="mt-7 flex items-center justify-center gap-8">
          <button onClick={() => swipe("pass")} className="btn btn-white h-16 w-16 p-0 text-coral" aria-label="Pass">
            <Icon name="x" size={30} stroke={3} />
          </button>
          <button onClick={() => swipe("like")} className="btn btn-coral h-[4.5rem] w-[4.5rem] p-0" aria-label="Like">
            <Icon name="heart" size={32} stroke={2.5} />
          </button>
        </div>
      )}
      {!done && (
        <p className="mt-4 hidden text-center text-xs font-semibold text-ink/50 sm:block">
          Drag the card, or use the buttons
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <span className="icon-btn mb-4 h-16 w-16 bg-violet-tint">
        <Icon name="home" size={28} />
      </span>
      <h3 className="text-xl font-bold">You're all caught up!</h3>
      <p className="mt-2 text-sm text-ink/60">
        No more flatmates match right now. Try widening your filters (gender, budget or area) or check
        back later.
      </p>
    </div>
  );
}
