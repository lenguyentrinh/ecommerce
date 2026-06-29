// Suspense fallback for client-side navigation into a PDP. Mirrors the page
// layout (gallery + info panel) so the transition feels stable. Pulses only
// when motion is safe.
export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[60%_40%] lg:gap-12">
        <div className="aspect-[4/5] w-full rounded-lg bg-warm-beige motion-safe:animate-pulse" />
        <div className="flex flex-col gap-6 bg-warm-white p-8">
          <div className="h-3 w-24 rounded-full bg-warm-beige motion-safe:animate-pulse" />
          <div className="h-7 w-2/3 rounded-full bg-warm-beige motion-safe:animate-pulse" />
          <div className="h-4 w-1/3 rounded-full bg-warm-beige motion-safe:animate-pulse" />
          <div className="mt-4 flex flex-col gap-3">
            <div className="h-4 w-full rounded-full bg-warm-beige motion-safe:animate-pulse" />
            <div className="h-4 w-full rounded-full bg-warm-beige motion-safe:animate-pulse" />
            <div className="h-4 w-4/5 rounded-full bg-warm-beige motion-safe:animate-pulse" />
          </div>
          <div className="mt-4 h-10 w-1/2 rounded-full bg-warm-beige motion-safe:animate-pulse" />
        </div>
      </div>
    </section>
  );
}
