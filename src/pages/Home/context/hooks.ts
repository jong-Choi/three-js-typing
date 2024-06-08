import { useContext } from "react";
import { TypingImpulseContext } from "./TypingContext";

export const useTypingImpulse = () => useContext(TypingImpulseContext);
