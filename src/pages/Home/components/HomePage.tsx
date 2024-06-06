import DropEffect3D from "./effects/DropEffect3D";

export default function HomePage(): React.ReactNode {
  return (
    <section>
      <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-y-5">
        <h1 className="mb-2 text-4xl font-bold">
          Three.js + Cannon.js Typing Page
        </h1>
        <div className="mb-4 flex gap-2"></div>
        <DropEffect3D />
      </div>
    </section>
  );
}
