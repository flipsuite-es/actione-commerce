export default function LoadingTienda() {
  return (
    <div className="container-lux py-14">
      <div className="mb-8 text-center">
        <div className="mx-auto hairline" />
        <div className="mx-auto mt-5 h-10 w-56 animate-pulse rounded bg-gold/10" />
        <div className="mx-auto mt-3 h-4 w-40 animate-pulse rounded bg-gold/10" />
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/5] w-full animate-pulse border border-gold/15 bg-gold/5" />
            <div className="mx-auto mt-3 h-4 w-2/3 animate-pulse rounded bg-gold/10" />
            <div className="mx-auto mt-2 h-3 w-1/3 animate-pulse rounded bg-gold/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
