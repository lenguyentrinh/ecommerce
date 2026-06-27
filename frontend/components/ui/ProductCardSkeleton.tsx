// Placeholder card shown while a product grid loads data client-side.
// Warm Beige blocks, 16px radius, 4:5 image — fades/pulses only when motion is safe.
export default function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg bg-warm-white shadow-ambient" aria-hidden="true">
      <div className="aspect-[4/5] rounded-t-lg bg-warm-beige motion-safe:animate-pulse" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-1/3 rounded-full bg-warm-beige motion-safe:animate-pulse" />
        <div className="h-4 w-2/3 rounded-full bg-warm-beige motion-safe:animate-pulse" />
        <div className="h-4 w-1/4 rounded-full bg-warm-beige motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
