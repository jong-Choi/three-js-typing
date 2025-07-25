import { useState } from "react";
import DropEffect3D from "./effects/DropEffect3D";
import TypingPractice from "./TypingPractice";
import { useTypingImpulse } from "../context/hooks";

const TYPING_TEXTS = [
  "AsyncAwait",
  "EventLoop",
  "PromiseHell",
  "ClosureTrap",
  "ThisBinding",
  "CallbackStack",
  "HoistingZone",
  "ShadowDOM",
  "FetchMachine",
].sort(() => Math.random() - 0.5);

export default function HomePage(): JSX.Element {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [input, setInput] = useState("");

  const { triggerImpulse } = useTypingImpulse();

  const currentText = TYPING_TEXTS[currentIdx % TYPING_TEXTS.length];
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSolved) return; // 정답 입력 시 입력 금지
    const value = e.target.value;
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
    <section
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#222",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "12px 0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto 8px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
        }}
      >
        <TypingPractice
          currentText={currentText}
          setCurrentIdx={setCurrentIdx}
          setHistory={setHistory}
          setIsSolved={setIsSolved}
          isSolved={isSolved}
          input={input}
          setInput={setInput}
        />
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: "0 0 auto",
          margin: "0 auto 8px auto",
          padding: "0 16px",
        }}
      >
        <DropEffect3D
          history={history}
          currentText={currentText}
          input={input}
        />
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "0 auto 16px auto",
          padding: "0 16px",
        }}
      >
        <input
          className="input-bordered input-primary input text-center font-mono"
          value={input}
          onChange={handleInputChange}
          maxLength={currentText.length}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          placeholder="입력하세요"
          style={{
            fontSize: 28,
            padding: "18px 0",
            borderRadius: 8,
            border: "2px solid #4fc3f7",
            outline: "none",
            marginBottom: 12,
            background: "#222",
            color: "#fff",
            letterSpacing: 2,
            width: "100%",
            boxSizing: "border-box",
            textAlign: "center",
          }}
        />
      </div>
    </section>
  );
}
