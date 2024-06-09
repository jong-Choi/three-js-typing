declare global {
  interface Window {
    __disappearedCount?: number;
  }
}

export type TypingImpulse = {
  type: "letter" | "word";
  index?: number;
  strength?: number;
  ts: number;
} | null;
