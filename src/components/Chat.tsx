import { useCallback, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "@neon/realtime-react";
import type { SealedLiveQuery } from "@neon/realtime/client";
import { fetchSealedMessages, sendMessage, type Match, type MessageRow } from "../api";
import Icon from "./Icon";

/** Fetches the sealed live query for a match; the Chat renders once it has one. */
export default function Chat({
  match,
  myId,
  onBack,
}: {
  match: Match;
  myId: string;
  onBack: () => void;
}) {
  const [sealed, setSealed] = useState<SealedLiveQuery<MessageRow>>();
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetchSealedMessages(match.matchId).then(
      (q) => !cancelled && setSealed(q),
      (e: Error) => !cancelled && setError(e.message)
    );
    return () => {
      cancelled = true;
    };
  }, [match.matchId]);

  return (
    <ChatShell match={match} onBack={onBack}>
      {sealed ? (
        <LiveChat match={match} myId={myId} sealed={sealed} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="card px-5 py-3 text-sm font-semibold">
            {error ? `Couldn't open chat: ${error}` : "Opening chat…"}
          </p>
        </div>
      )}
    </ChatShell>
  );
}

function LiveChat({
  match,
  myId,
  sealed,
}: {
  match: Match;
  myId: string;
  sealed: SealedLiveQuery<MessageRow>;
}) {
  const refreshQuery = useCallback(() => fetchSealedMessages(match.matchId), [match.matchId]);
  const { data, status, error, utils } = useLiveQuery(sealed, { refreshQuery });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const them = match.profile;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError("");
    try {
      const { txid } = await sendMessage(match.matchId, text);
      setDraft("");
      // Wait for our own write to arrive on the live query, so it never "jumps" in late.
      await utils.awaitTxId(txid, 10_000).catch(() => undefined);
    } catch (e) {
      setSendError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto max-w-2xl space-y-2.5">
          <p className="mx-auto mb-4 w-fit rounded-full border-2 border-ink bg-white px-3 py-1 text-center text-xs font-semibold">
            You matched with {them.name}. Say hello!
          </p>
          {status === "error" && (
            <p role="alert" className="text-center text-xs font-semibold text-coral">
              Live updates stopped: {error?.message}
            </p>
          )}
          {data === undefined && status !== "error" && (
            <p className="text-center text-xs font-semibold text-ink/50">Loading messages…</p>
          )}
          {data?.map((m) => (
            <Bubble key={m.id} mine={m.sender_id === myId}>
              {m.body}
            </Bubble>
          ))}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t-2 border-ink bg-violet-tint p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {sendError && <p className="mx-auto max-w-2xl pb-2 text-xs font-semibold text-coral">{sendError}</p>}
        <div className="mx-auto flex max-w-2xl items-center gap-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`Message ${them.name}…`}
            className="field flex-1 rounded-full py-2.5"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="btn btn-coral h-11 w-11 shrink-0 p-0"
            aria-label="Send"
          >
            <Icon name="send" size={18} />
          </button>
        </div>
      </div>
    </>
  );
}

function ChatShell({
  match,
  onBack,
  children,
}: {
  match: Match;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const them = match.profile;
  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-center bg-ink/40 md:p-6 md:backdrop-blur-sm">
      <div
        className="flex w-full max-w-3xl flex-col overflow-hidden bg-paper md:rounded-3xl md:border-2 md:border-ink md:shadow-brut-lg"
        style={{
          backgroundImage:
            "linear-gradient(rgba(101,71,202,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(101,71,202,0.09) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      >
        <header className="bar flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button onClick={onBack} className="icon-btn h-10 w-10" aria-label="Back">
            <Icon name="back" size={20} />
          </button>
          <img src={them.photos[0]} alt={them.name} className="h-11 w-11 rounded-full border-2 border-ink object-cover" />
          <div className="min-w-0">
            <div className="truncate font-bold leading-tight">{them.name}</div>
            <div className="flex items-center gap-1 text-xs text-ink/60">
              <Icon name="pin" size={12} /> {them.areas[0]}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
function Bubble({ mine, children }: { mine: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl border-2 border-ink px-3.5 py-2 text-sm font-medium shadow-brut-sm ${
          mine
            ? "bg-violet text-white rounded-br-md"
            : "bg-white rounded-bl-md"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
