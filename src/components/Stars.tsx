const STAR =
  "M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.51L10 14.98l-4.94 2.84.94-5.51-4-3.9 5.53-.8z";

function Row({ color }: { color: string }) {
  return (
    <span className="flex">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 20 20" fill={color}>
          <path d={STAR} />
        </svg>
      ))}
    </span>
  );
}

/** Estrellas de solo lectura. `value` de 0 a 5 (admite decimales). */
export default function Stars({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span
      className="relative inline-block align-middle"
      style={{ width: 90, height: 18 }}
      aria-label={`${value.toFixed(1)} de 5`}
    >
      <span className="absolute inset-0">
        <Row color="rgba(169,129,47,0.22)" />
      </span>
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <Row color="#C9A24B" />
      </span>
    </span>
  );
}
