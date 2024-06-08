import { useEffect, useState } from "react";
import { useTypingImpulse } from "../context/hooks";

interface TypingPracticeProps {
  currentText: string;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
}

export default function TypingPractice({
  currentText,
  setCurrentIdx,
}: TypingPracticeProps) {
  const [input, setInput] = useState("");
  const [isSolved, setIsSolved] = useState(false);
  const { triggerImpulse } = useTypingImpulse();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSolved) return; // 정답 입력 시 입력 금지
    const value = e.target.value.toUpperCase();
    // 마지막 입력 글자 인덱스
    const idx = value.length - 1;
    if (idx >= 0) {
      if (value[idx] === currentText[idx]) {
        // 맞춘 글자: 강한 임펄스
        triggerImpulse({
          type: "letter",
          index: idx,
          strength: 30,
          ts: Date.now(),
        });
      } else {
        // 틀린 글자: 약한 임펄스
        triggerImpulse({
          type: "letter",
          index: idx,
          strength: 8,
          ts: Date.now(),
        });
      }
    }
    setInput(value);
  };

  // 정답 입력 시 다음 문장으로
  useEffect(() => {
    if (input === currentText && !isSolved) {
      setIsSolved(true);
      triggerImpulse({ type: "word", strength: 80, ts: Date.now() });
      setTimeout(() => {
        setInput("");
        setCurrentIdx((idx) => idx + 1);
        setIsSolved(false);
      }, 400);
    }
  }, [input, currentText, isSolved, triggerImpulse, setCurrentIdx]);

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
        className="input input-bordered input-primary w-60 text-center font-mono"
        value={input}
        onChange={handleInputChange}
        maxLength={currentText.length}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        placeholder="Type here..."
      />
    </div>
  );
}
