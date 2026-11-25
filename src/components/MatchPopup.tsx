import { motion } from "framer-motion";
import type { Profile } from "../types";
import Icon from "./Icon";

/** "It's a match" screen: two tilted photo cards linked by a heart badge. */
export default function MatchPopup({
  me,
  them,
  onClose,
  onGoToMatches,
  onMessage,
}: {
  me: Profile;
  them: Profile;
  onClose: () => void;
  onGoToMatches: () => void;
  onMessage: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 260 }}
        className="card w-full max-w-sm overflow-hidden bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-60 items-center justify-center">
          <img
            src={me.photos[0]}
            alt="You"
            className="absolute left-[16%] top-8 h-40 w-32 -rotate-6 rounded-2xl border-2 border-ink object-cover shadow-brut"
          />
          <img
            src={them.photos[0]}
            alt={them.name}
            className="absolute right-[16%] top-10 h-40 w-32 rotate-6 rounded-2xl border-2 border-ink object-cover shadow-brut"
          />
          <span className="absolute top-[6.5rem] z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-coral text-white shadow-brut">
            <Icon name="heart" size={26} />
          </span>
        </div>

        <div className="px-6 pb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">It's a match!</h2>
          <p className="mt-1 text-sm text-ink/60">You and {them.name} liked each other.</p>

          <div className="mt-6 space-y-3">
            <button onClick={onMessage} className="btn btn-coral w-full">
              <Icon name="chat" size={18} /> Send a message
            </button>
            <button onClick={onGoToMatches} className="btn btn-white w-full">
              See all matches
            </button>
            <button onClick={onClose} className="btn-ghost w-full text-sm">
              Keep swiping
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
