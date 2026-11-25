import { useRef, useState } from "react";
import {
  BANGALORE_AREAS,
  PERSONALITY_TRAITS,
  type Area,
  type Gender,
  type Profile,
  type Trait,
} from "../types";
import Icon from "./Icon";

const GENDERS: Gender[] = ["Female", "Male", "Non-binary"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileSetup({
  userId,
  initial,
  onSave,
}: {
  userId: string;
  initial?: Profile;
  onSave: (profile: Profile) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState(initial?.age ?? 25);
  const [gender, setGender] = useState<Gender>(initial?.gender ?? "Female");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [areas, setAreas] = useState<Area[]>(initial?.areas ?? []);
  const [budgetMin, setBudgetMin] = useState(initial?.budgetMin ?? 15000);
  const [budgetMax, setBudgetMax] = useState(initial?.budgetMax ?? 25000);
  const [roommates, setRoommates] = useState(initial?.roommates ?? 1);
  const [social, setSocial] = useState(initial?.social ?? 50);
  const [traits, setTraits] = useState<Trait[]>(initial?.traits ?? []);
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 2 - photos.length);
    const urls = await Promise.all(files.map(readFileAsDataUrl));
    setPhotos((p) => [...p, ...urls].slice(0, 2));
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleArea(a: Area) {
    setAreas((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  function toggleTrait(t: Trait) {
    setTraits((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : cur.length < 6 ? [...cur, t] : cur
    );
  }

  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) return setError("Please add your name.");
    if (photos.length < 2) return setError("Please add 2 photos.");
    if (areas.length === 0) return setError("Pick at least one area.");
    if (budgetMin > budgetMax) return setError("Min budget can't exceed max budget.");
    setError("");
    setSaving(true);
    await onSave({
      id: userId,
      name: name.trim(),
      age,
      gender,
      photos,
      areas,
      budgetMin,
      budgetMax,
      roommates,
      social,
      traits,
      bio: bio.trim() || undefined,
    })
      .catch((e: Error) => setError(e.message))
      .finally(() => setSaving(false));
  }

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-32 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {initial ? "Edit your profile" : "Set up your profile"}
        </h1>
        <p className="mt-1 text-sm text-ink/60">This is what potential flatmates will see.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Photos */}
        <Section title="Two photos" className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:max-w-md">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl border-2 border-ink bg-violet-tint"
              >
                {photos[i] ? (
                  <>
                    <img src={photos[i]} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="icon-btn absolute right-2 top-2 h-8 w-8"
                      aria-label="Remove photo"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink/60 hover:text-ink"
                  >
                    <span className="icon-btn h-11 w-11 bg-white">
                      <Icon name="camera" />
                    </span>
                    <span className="text-xs font-semibold">Add photo</span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickPhotos} />
        </Section>

        <Section title="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            className="field"
          />
        </Section>

        <Section title={`Age · ${age}`}>
          <input type="range" min={18} max={60} value={age} onChange={(e) => setAge(Number(e.target.value))} />
          <div className="mt-4 flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <Chip key={g} active={gender === g} onClick={() => setGender(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="Areas you're looking in" className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            {BANGALORE_AREAS.map((a) => (
              <Chip key={a} active={areas.includes(a)} onClick={() => toggleArea(a)}>
                {a}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={`Budget · ${inr(budgetMin)} – ${inr(budgetMax)} / month`}>
          <span className="text-xs font-semibold text-ink/50">Minimum</span>
          <input type="range" min={5000} max={60000} step={1000} value={budgetMin} onChange={(e) => setBudgetMin(Number(e.target.value))} className="mb-4 mt-2" />
          <span className="text-xs font-semibold text-ink/50">Maximum</span>
          <input type="range" min={5000} max={60000} step={1000} value={budgetMax} onChange={(e) => setBudgetMax(Number(e.target.value))} className="mt-2" />
        </Section>

        <div className="grid gap-5">
          <Section title="Flatmates you want">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <Chip key={n} active={roommates === n} onClick={() => setRoommates(n)}>
                  {n}
                </Chip>
              ))}
            </div>
          </Section>

          <Section title="Your social style">
            <input type="range" min={0} max={100} value={social} onChange={(e) => setSocial(Number(e.target.value))} />
            <div className="mt-2 flex justify-between text-xs font-semibold text-ink/60">
              <span>Introvert</span>
              <span>Extrovert</span>
            </div>
          </Section>
        </div>

        <Section title={`Personality traits · ${traits.length}/6`} className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            {PERSONALITY_TRAITS.map((t) => (
              <Chip key={t} active={traits.includes(t)} onClick={() => toggleTrait(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title="A little about you (optional)" className="md:col-span-2">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="e.g. Early riser, love cooking, work from home 3 days a week."
            className="field resize-none"
          />
        </Section>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl border-2 border-ink bg-coral-tint px-4 py-3 text-sm font-semibold">{error}</p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-ink bg-white/90 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button onClick={submit} disabled={saving} className="btn btn-coral mx-auto flex w-full max-w-md">
          {saving ? "Saving…" : initial ? "Save changes" : "Start swiping"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`card p-5 ${className}`}>
      <h3 className="label">{title}</h3>
      {children}
    </section>
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
