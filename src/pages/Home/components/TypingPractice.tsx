import { useEffect, useState } from "react";
import { useTypingImpulse } from "../context/hooks";

interface TypingPracticeProps {
  currentText: string;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setIsSolved: React.Dispatch<React.SetStateAction<boolean>>;
  isSolved: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
}

export default function TypingPractice({
  currentText,
  setCurrentIdx,
  setHistory,
  setIsSolved,
  isSolved,
  input,
  setInput,
}: TypingPracticeProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [kpm, setKpm] = useState(0); // KPM(타수)
  const [bestKpm, setBestKpm] = useState(0); // 최고 타수

  const { triggerImpulse } = useTypingImpulse();
  // 입력 시작 시 시간 기록
  useEffect(() => {
    if (input.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [input, startTime]);

  // 정답 입력 시 KPM 계산 (한컴타자연습 기준: 실제 입력한 키 수)
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
    setIsSolved,
    triggerImpulse,
    setCurrentIdx,
    setHistory,
    setInput,
  ]);
  return (
    <>
      <div
        style={{
          width: 1200,
          maxWidth: "95vw",
          margin: "24px auto 12px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            color: "#fff",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          최고 타수: <span style={{ color: "#4fc3f7" }}>{bestKpm}</span> / 방금
          입력: <span style={{ color: "#ffd54f" }}>{kpm}</span>
        </div>
        {/* 정답 문자열(문장) */}
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 32,
            fontFamily: "monospace",
            background: "#333",
            padding: "12px 24px",
            borderRadius: 12,
            boxShadow: "0 2px 12px #0004",
            width: "100%",
            justifyContent: "center",
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
      </div>
    </>
  );
}
