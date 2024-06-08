import { createContext, useState, ReactNode } from "react";
import { TypingImpulse } from "./types";

export const TypingImpulseContext = createContext<{
  impulse: TypingImpulse;
  triggerImpulse: (impulse: TypingImpulse) => void;
}>({
  impulse: null,
  triggerImpulse: () => {
    /* noop */
  },
});

export const TypingImpulseProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [impulse, setImpulse] = useState<TypingImpulse>(null);
  const triggerImpulse = (impulse: TypingImpulse) => setImpulse(impulse);
  return (
    <TypingImpulseContext.Provider value={{ impulse, triggerImpulse }}>
      {children}
    </TypingImpulseContext.Provider>
  );
};
