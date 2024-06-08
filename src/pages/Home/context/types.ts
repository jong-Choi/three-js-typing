export type TypingImpulse =
  | { type: "letter"; index: number; strength: number; ts: number }
  | { type: "word"; strength: number; ts: number }
  | null;
