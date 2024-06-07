import DropEffect3D from "./effects/DropEffect3D";

export default function HomePage(): React.ReactNode {
  return (
    <section
      style={{ minHeight: "100vh", width: "100vw", background: "#353942" }}
    >
      <div
        className="flex flex-col items-center justify-center gap-y-5"
        style={{ minHeight: "100vh", width: "100vw", background: "#353942" }}
      >
        <h1 className="mb-2 text-4xl font-bold">
          Three.js + Cannon.js Typing Page
        </h1>
        <div className="mb-4 flex gap-2"></div>
        <DropEffect3D />
      </div>
    </section>
  );
}
