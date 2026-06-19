import BestSellerSection from "@/components/home/BestSellerSection";
import HomeCarousel from "@/components/home/HomeCarousel";

export default function Home() {
  return (
    <>
      <HomeCarousel />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section className="space-y-4 rounded-3xl bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Welcome</p>
          <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">Your Daily Food Store</h1>
          <p className="max-w-2xl text-slate-600">
            Fresh fruits, vegetables, and healthy essentials delivered to your home. Explore our daily deals and best
            sellers.
          </p>
        </section>

        <BestSellerSection />
      </main>
    </>
  );
}
