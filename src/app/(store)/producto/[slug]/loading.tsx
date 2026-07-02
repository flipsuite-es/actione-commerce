export default function LoadingProducto() {
  return (
    <div className="container-lux py-10">
      <div className="mb-8 h-3 w-48 animate-pulse rounded bg-gold/10" />
      <div className="grid gap-12 md:grid-cols-2">
        <div className="aspect-[4/5] w-full animate-pulse border border-gold/15 bg-gold/5" />
        <div className="md:pt-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-gold/10" />
          <div className="mt-4 h-6 w-24 animate-pulse rounded bg-gold/10" />
          <div className="mt-8 h-12 w-full animate-pulse rounded bg-gold/10" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-gold/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gold/10" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gold/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
