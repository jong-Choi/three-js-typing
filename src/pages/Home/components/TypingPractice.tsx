import { useEffect, useState } from "react";
import { useTypingImpulse } from "../context/hooks";

interface TypingPracticeProps {
  currentText: string;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function TypingPractice({
  currentText,
  setCurrentIdx,
  setHistory,
}: TypingPracticeProps) {
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [kpm, setKpm] = useState(0); // KPM(타수)
  const [bestKpm, setBestKpm] = useState(0); // 최고 타수
  const [isSolved, setIsSolved] = useState(false);
  const { triggerImpulse } = useTypingImpulse();

  useEffect(() => {
    if (input.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [input, startTime]);

  useEffect(() => {
    if (input === currentText && !isSolved && startTime) {
      setIsSolved(true);
      const elapsed = (Date.now() - startTime) / 1000 / 60;

      const keystrokes = input.length;
      const newKpm = Math.round(keystrokes / elapsed);
      setKpm(newKpm);
      setBestKpm((prev) => (newKpm > prev ? newKpm : prev));
      triggerImpulse({ type: "word", strength: 80, ts: Date.now() });
      setTimeout(() => {
        setInput("");
        setCurrentIdx((idx) => idx + 1);
        setIsSolved(false);
        setHistory((prev) => [...prev, currentText]);
        setStartTime(null);
      }, 1000);
    }
  }, [
    input,
    currentText,
    isSolved,
    startTime,
    triggerImpulse,
    setCurrentIdx,
    setHistory,
  ]);

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

  return (
    <>
      <div
        style={{
          color: "#fff",
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 24,
          letterSpacing: 1,
        }}
      >
        최고 타수: <span style={{ color: "#4fc3f7" }}>{bestKpm}</span> / 방금
        입력: <span style={{ color: "#ffd54f" }}>{kpm}</span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          fontSize: 32,
          fontFamily: "monospace",
          background: "#333",
          padding: "16px 32px",
          borderRadius: 12,
          boxShadow: "0 2px 12px #0004",
        }}
      >
        {currentText.split("").map((ch, i) => (
          <span
            key={i}
            style={{
              minWidth: 28,
              borderBottom: "2px solid #888",
              color:
                input[i] === undefined
                  ? "#aaa"
                  : input[i] === ch
                  ? "#4fc3f7"
                  : "#f06292",
              background:
                input[i] === undefined
                  ? "transparent"
                  : input[i] === ch
                  ? "#222"
                  : "#2a1a1a",
              textDecoration: input[i] === ch ? "underline" : undefined,
              textAlign: "center",
              padding: "0 2px",
              borderRadius: 4,
              transition: "all 0.1s",
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
        style={{
          fontSize: 24,
          padding: "8px 16px",
          borderRadius: 8,
          border: "2px solid #4fc3f7",
          outline: "none",
          marginBottom: 24,
          background: "#222",
          color: "#fff",
          letterSpacing: 2,
        }}
      />
    </>
  );
}
