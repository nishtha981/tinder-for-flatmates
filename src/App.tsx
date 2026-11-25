import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import OnboardingRegister from "./components/OnboardingRegister";
import ProfileSetup from "./components/ProfileSetup";
import SwipeDeck from "./components/SwipeDeck";
import Matches from "./components/Matches";
import MatchPopup from "./components/MatchPopup";
import Chat from "./components/Chat";
import FilterSheet from "./components/FilterSheet";
import NavBar, { NavTabs, type Tab } from "./components/NavBar";
import Icon from "./components/Icon";
import { Wordmark } from "./components/Art";
import { activeFilterCount, defaultFilters } from "./lib/filtering";
import { getMatches, getMe, logout, saveProfile, type Match } from "./api";
import type { DiscoverFilters, Profile, User } from "./types";

type Screen = "register" | "setup" | "app";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("discover");
  const [matched, setMatched] = useState<Match | null>(null);
  const [chatWith, setChatWith] = useState<Match | null>(null);
  const [filters, setFilters] = useState<DiscoverFilters | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  // deckKey remounts the deck after a profile edit so filters re-apply.
  const [deckKey, setDeckKey] = useState(0);

  // Restore the session (if any) from the API.
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Keep the nav badge in sync with the server.
  useEffect(() => {
    if (user?.profile) getMatches().then((m) => setMatchCount(m.length)).catch(() => undefined);
  }, [user?.profile, matched]);

  const screen: Screen = !user
    ? "register"
    : !user.profile || editing
    ? "setup"
    : "app";

  function handleRegistered(u: User) {
    setUser(u);
  }

  async function handleSaveProfile(profile: Profile) {
    const saved = await saveProfile(profile, user?.profile);
    setUser({ ...(user as User), profile: saved });
    setEditing(false);
    setDeckKey((k) => k + 1);
    setTab("discover");
  }

  function handleMatch(match: Match) {
    setMatched(match);
  }

  async function startOver() {
    await logout();
    setUser(null);
    setMatched(null);
    setChatWith(null);
    setFilters(null);
    setShowFilters(false);
    setMatchCount(0);
    setEditing(false);
    setTab("discover");
  }

  if (loading || loadError) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-5 px-5 text-center">
        <Wordmark />
        <p className="card px-5 py-3 text-sm font-semibold">
          {loadError ? `Couldn't reach the server: ${loadError}` : "Loading…"}
        </p>
      </div>
    );
  }

  if (screen === "register") {
    return <OnboardingRegister onDone={handleRegistered} />;
  }

  if (screen === "setup") {
    return (
      <ProfileSetup
        userId={user!.id}
        initial={editing ? user!.profile : undefined}
        onSave={handleSaveProfile}
      />
    );
  }

  const me = user!.profile!;
  const effectiveFilters = filters ?? defaultFilters(me);
  const filterCount = activeFilterCount(effectiveFilters, me);
  // Serialize filters so the deck remounts (and re-filters) when they change.
  const filterKey = JSON.stringify(effectiveFilters);

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const social = me.social <= 33 ? "Introvert" : me.social >= 67 ? "Extrovert" : "Ambivert";

  return (
    <div className="min-h-full flex flex-col">
      <header className="bar sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={() => setTab("discover")} aria-label="FlatMate home">
            <Wordmark size="sm" />
          </button>
          <NavTabs tab={tab} onChange={setTab} matchCount={matchCount} />
          {tab === "discover" ? (
            <button onClick={() => setShowFilters(true)} className="btn btn-white relative px-4 py-2 text-sm">
              <Icon name="sliders" size={16} /> Filters
              {filterCount > 0 && (
                <span className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full border-2 border-ink bg-coral px-1 text-[10px] font-bold leading-4 text-white">
                  {filterCount}
                </span>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold">
              <Icon name="pin" size={14} className="text-coral" /> Bangalore
            </span>
          )}
        </div>
      </header>

      <main className="flex-1">
        {tab === "discover" && (
          <SwipeDeck
            key={`${deckKey}-${filterKey}`}
            me={me}
            filters={effectiveFilters}
            onMatch={handleMatch}
          />
        )}
        {tab === "matches" && (
          <Matches
            onStartSwiping={() => setTab("discover")}
            onOpenChat={(p) => setChatWith(p)}
          />
        )}
        {tab === "profile" && (
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                {me.photos.map((src, i) => (
                  <div key={i} className={`overflow-hidden rounded-3xl border-2 border-ink bg-violet-tint shadow-brut ${i > 0 ? "md:hidden" : ""}`}>
                    <img src={src} alt={i === 0 ? me.name : ""} className="aspect-[3/4] h-full w-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="space-y-5">
                <div className="card p-6">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">{me.name}</h2>
                    <span className="text-2xl font-medium">{me.age}</span>
                    <span className="ml-auto rounded-full bg-coral-tint px-2.5 py-0.5 text-xs font-semibold">{me.gender}</span>
                  </div>
                  {me.bio && <p className="mt-3 text-sm text-ink/70">{me.bio}</p>}
                  <dl className="mt-5 space-y-3 text-sm">
                    <div className="flex items-start gap-3 border-t-2 border-ink/10 pt-3">
                      <Icon name="pin" size={18} className="mt-0.5 text-coral" />
                      <div><dt className="label mb-0.5">Areas</dt><dd className="font-semibold">{me.areas.join(", ")}</dd></div>
                    </div>
                    <div className="flex items-start gap-3 border-t-2 border-ink/10 pt-3">
                      <Icon name="rupee" size={18} className="mt-0.5 text-coral" />
                      <div><dt className="label mb-0.5">Budget</dt><dd className="font-semibold">{inr(me.budgetMin)} – {inr(me.budgetMax)} / month</dd></div>
                    </div>
                    <div className="flex items-start gap-3 border-t-2 border-ink/10 pt-3">
                      <Icon name="users" size={18} className="mt-0.5 text-coral" />
                      <div><dt className="label mb-0.5">Looking for</dt><dd className="font-semibold">{me.roommates} flatmate{me.roommates > 1 ? "s" : ""}</dd></div>
                    </div>
                    <div className="flex items-start gap-3 border-t-2 border-ink/10 pt-3">
                      <Icon name="smile" size={18} className="mt-0.5 text-coral" />
                      <div><dt className="label mb-0.5">Social style</dt><dd className="font-semibold">{social}</dd></div>
                    </div>
                  </dl>
                  {me.traits.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {me.traits.map((t) => (
                        <span key={t} className="tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button onClick={() => setEditing(true)} className="btn btn-coral flex-1">
                    <Icon name="pencil" size={18} /> Edit profile
                  </button>
                  <button onClick={startOver} className="btn btn-white flex-1">
                    <Icon name="logout" size={18} /> Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <NavBar tab={tab} onChange={setTab} matchCount={matchCount} />

      <AnimatePresence>
        {matched && (
          <MatchPopup
            me={me}
            them={matched.profile}
            onClose={() => setMatched(null)}
            onGoToMatches={() => {
              setMatched(null);
              setTab("matches");
            }}
            onMessage={() => {
              const them = matched;
              setMatched(null);
              setTab("matches");
              setChatWith(them);
            }}
          />
        )}
      </AnimatePresence>

      {chatWith && <Chat match={chatWith} myId={user!.id} onBack={() => setChatWith(null)} />}

      <AnimatePresence>
        {showFilters && (
          <FilterSheet
            me={me}
            current={effectiveFilters}
            onClose={() => setShowFilters(false)}
            onApply={(f) => {
              setFilters(f);
              setShowFilters(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
