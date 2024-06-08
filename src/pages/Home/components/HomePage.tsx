import { useState } from "react";
import DropEffect3D from "./effects/DropEffect3D";
import TypingPractice from "./TypingPractice";
import { TypingImpulseProvider } from "../context/TypingContext";

const TYPING_TEXTS = ["TYPING", "REACT", "JAVASCRIPT", "HELLO", "OPENAI"];

export default function HomePage(): React.ReactNode {
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentText = TYPING_TEXTS[currentIdx % TYPING_TEXTS.length];

  const handleComplete = () => {
    setCurrentIdx((idx) => idx + 1);
  };

  return (
    <TypingImpulseProvider>
      <section
        style={{ minHeight: "100vh", width: "100vw", background: "#353942" }}
      >
        <div
          className="flex flex-col items-center justify-center gap-y-5"
          style={{ minHeight: "100vh", width: "100vw", background: "#353942" }}
        >
          <h1 className="mb-2 text-4xl font-bold">3D 타자 연습</h1>
          <TypingPractice
            currentText={currentText}
            onComplete={handleComplete}
            setCurrentIdx={setCurrentIdx}
          />
          <div className="mb-4 flex gap-2"></div>
          <DropEffect3D text={currentText} />
        </div>
      </section>
    </TypingImpulseProvider>
  );
}
