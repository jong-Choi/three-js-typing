import { useEffect, useRef, useState } from "react";

interface TypingPracticeProps {
  currentText: string;
  onComplete: () => void;
}

export default function TypingPractice({
  currentText,
  onComplete,
}: TypingPracticeProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentText]);

  useEffect(() => {
    if (input === currentText) {
      setTimeout(() => {
        setInput("");
        onComplete();
      }, 400);
    }
  }, [input, currentText, onComplete]);

  return (
    <div className="mb-2 flex flex-col items-center">
      <div className="mb-1 font-mono text-lg tracking-widest">
        {currentText.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              color:
                input[i] === ch ? "#4fc3f7" : input[i] ? "#f06292" : "#aaa",
              textDecoration: input[i] === ch ? "underline" : undefined,
            }}
          >
            {ch}
          </span>
        ))}
      </div>
      <input
        ref={inputRef}
        className="input input-bordered input-primary w-60 text-center font-mono"
        value={input}
        onChange={(e) => setInput(e.target.value.toUpperCase())}
        maxLength={currentText.length}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        placeholder="Type here..."
      />
    </div>
  );
}
