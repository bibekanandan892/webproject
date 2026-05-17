export function GlassBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="glass-blob drift-a"
        style={{
          top: "-10%",
          left: "-5%",
          width: "55vw",
          height: "55vw",
          background: "radial-gradient(circle at 30% 30%, #FF7BD5, transparent 60%)",
        }}
      />
      <div
        className="glass-blob drift-b"
        style={{
          top: "20%",
          right: "-10%",
          width: "50vw",
          height: "50vw",
          background: "radial-gradient(circle at 70% 30%, #7DE2FF, transparent 60%)",
        }}
      />
      <div
        className="glass-blob drift-c"
        style={{
          bottom: "-15%",
          left: "10%",
          width: "60vw",
          height: "60vw",
          background: "radial-gradient(circle at 50% 50%, #C7B9FF, transparent 60%)",
        }}
      />
      <div
        className="glass-blob drift-d"
        style={{
          top: "55%",
          left: "40%",
          width: "40vw",
          height: "40vw",
          background: "radial-gradient(circle at 50% 50%, #FFD479, transparent 60%)",
          opacity: 0.5,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 0%, transparent, rgba(10,5,24,0.55))",
        }}
      />
    </div>
  );
}
