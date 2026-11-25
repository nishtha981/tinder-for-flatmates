export type Gender = "Male" | "Female" | "Non-binary";

/** Popular flatmate-hunting areas in Bangalore. */
export const BANGALORE_AREAS = [
  "Koramangala",
  "Indiranagar",
  "HSR Layout",
  "BTM Layout",
  "Whitefield",
  "Marathahalli",
  "Bellandur",
  "Electronic City",
  "JP Nagar",
  "Jayanagar",
  "Sarjapur Road",
  "Hebbal",
  "Yelahanka",
  "Rajajinagar",
  "Malleshwaram",
] as const;

export type Area = (typeof BANGALORE_AREAS)[number];

/** Soft personality traits shown on the card (not used for hard filtering). */
export const PERSONALITY_TRAITS = [
  "Clean & tidy",
  "Early riser",
  "Night owl",
  "Foodie",
  "Fitness freak",
  "Non-smoker",
  "Pet-friendly",
  "Works from home",
  "Social butterfly",
  "Quiet & private",
  "Gamer",
  "Veg only",
  "Loves cooking",
  "Travel junkie",
  "Music lover",
] as const;

export type Trait = (typeof PERSONALITY_TRAITS)[number];

/** 0 = fully introverted, 100 = fully extroverted. */
export type SocialStyle = number;

export interface Profile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  photos: string[]; // signed image URLs from the API, or data: URLs for not-yet-uploaded picks (expect 2)
  photoKeys?: string[]; // object-storage keys behind `photos`, set by the API
  areas: Area[]; // areas they're looking in
  budgetMin: number; // monthly rent, INR
  budgetMax: number;
  roommates: number; // number of flatmates they want to live with
  social: SocialStyle; // introvert (0) .. extrovert (100)
  traits: Trait[];
  bio?: string;
}

export interface User {
  id: string;
  mobile: string;
  email: string;
  profile?: Profile;
}

export type SwipeDirection = "like" | "pass";

export interface SwipeRecord {
  profileId: string;
  direction: SwipeDirection;
}

/** User-adjustable discovery filters applied on top of the base eligibility. */
export interface DiscoverFilters {
  genders: Gender[]; // empty = everyone
  areas: Area[]; // empty = all of the user's areas
  budgetMin: number;
  budgetMax: number;
}

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  at: number; // epoch ms
}
