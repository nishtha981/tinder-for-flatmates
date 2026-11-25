import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { useState } from "react";
import type { Profile, SwipeDirection } from "../types";
import Icon from "./Icon";

function socialLabel(s: number): string {
  if (s <= 33) return "Introvert";
  if (s >= 67) return "Extrovert";
  return "Ambivert";
}

export default function SwipeCard({
  profile,
  onSwipe,
}: {
  profile: Profile;
  onSwipe: (dir: SwipeDirection) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-20, -120], [0, 1]);
  const [photoIdx, setPhotoIdx] = useState(0);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 120) onSwipe("like");
    else if (info.offset.x < -120) onSwipe("pass");
  }

  const inr = (n: number) => `₹${(n / 1000).toFixed(0)}k`;

  return (
    <motion.div
      className="absolute inset-0 select-none overflow-hidden rounded-3xl border-2 border-ink bg-violet-tint shadow-brut-lg cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.99 }}
    >
      <img
        src={profile.photos[photoIdx]}
        alt={profile.name}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* photo tap zones + progress */}
      {profile.photos.length > 1 && (
        <>
          <button className="absolute inset-y-0 left-0 w-1/2" onClick={() => setPhotoIdx(0)} aria-label="Previous photo" />
          <button className="absolute inset-y-0 right-0 w-1/2" onClick={() => setPhotoIdx(1)} aria-label="Next photo" />
          <div className="absolute inset-x-4 top-4 flex gap-1.5">
            {profile.photos.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full border border-ink ${i === photoIdx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}

      {/* LIKE / NOPE stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute left-5 top-10 -rotate-12 rounded-xl border-[3px] border-ink bg-violet px-4 py-1 text-3xl font-bold text-white shadow-brut"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute right-5 top-10 rotate-12 rounded-xl border-[3px] border-ink bg-coral px-4 py-1 text-3xl font-bold text-white shadow-brut"
      >
        NOPE
      </motion.div>

      {/* info panel */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-2xl border-2 border-ink bg-white p-4 shadow-brut-sm">
        <div className="flex items-baseline gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{profile.name}</h2>
          <span className="text-xl font-medium">{profile.age}</span>
          <span className="ml-auto rounded-full bg-coral-tint px-2 py-0.5 text-xs font-semibold">{profile.gender}</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px] font-medium text-ink/80">
          <span className="col-span-2 flex items-center gap-1.5"><Icon name="pin" size={15} className="text-coral" />{profile.areas.join(", ")}</span>
          <span className="flex items-center gap-1.5"><Icon name="rupee" size={15} className="text-coral" />{inr(profile.budgetMin)}–{inr(profile.budgetMax)}/mo</span>
          <span className="flex items-center gap-1.5"><Icon name="users" size={15} className="text-coral" />{profile.roommates} flatmate{profile.roommates > 1 ? "s" : ""}</span>
          <span className="flex items-center gap-1.5"><Icon name="smile" size={15} className="text-coral" />{socialLabel(profile.social)}</span>
        </div>

        {profile.bio && <p className="mt-2 line-clamp-2 text-sm text-ink/70">{profile.bio}</p>}

        {profile.traits.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.traits.slice(0, 4).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
            {profile.traits.length > 4 && <span className="tag bg-white">+{profile.traits.length - 4}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
