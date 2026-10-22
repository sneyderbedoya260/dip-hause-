export default function Loading() {
  return (
    <main className="wrap" aria-busy="true">
      <div className="skel" style={{ height: 220, marginTop: 40 }} />
      <div className="grid" style={{ marginTop: 32 }}>
        {[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 300, borderRadius: 18 }} />)}
      </div>
    </main>
  );
}
