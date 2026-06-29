// Suspense fallback for client-side navigation into a PDP. Mirrors the shipped
// layout (pastel mesh + bento gallery + glass info card) so the transition
// feels stable. Pulses only when motion is safe.
export default function Loading() {
  return (
    <div className="account-mesh">
      <section className="mx-auto w-full max-w-[1400px] px-5 py-12 md:px-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:w-[58%]">
            <div className="soft-shadow aspect-[4/5] rounded-lg bg-white/30 motion-safe:animate-pulse md:col-span-2" />
            <div className="soft-shadow aspect-square rounded-lg bg-white/30 motion-safe:animate-pulse" />
            <div className="soft-shadow aspect-square rounded-lg bg-white/30 motion-safe:animate-pulse" />
          </div>
          <div className="glass-panel soft-shadow flex w-full flex-col gap-6 rounded-lg p-8 lg:w-[42%]">
            <div className="h-3 w-24 rounded-full bg-white/40 motion-safe:animate-pulse" />
            <div className="h-8 w-2/3 rounded-full bg-white/40 motion-safe:animate-pulse" />
            <div className="h-4 w-1/3 rounded-full bg-white/40 motion-safe:animate-pulse" />
            <div className="mt-4 h-12 w-1/2 rounded-full bg-white/40 motion-safe:animate-pulse" />
            <div className="mt-4 flex flex-col gap-3">
              <div className="h-4 w-full rounded-full bg-white/40 motion-safe:animate-pulse" />
              <div className="h-4 w-full rounded-full bg-white/40 motion-safe:animate-pulse" />
              <div className="h-4 w-4/5 rounded-full bg-white/40 motion-safe:animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
