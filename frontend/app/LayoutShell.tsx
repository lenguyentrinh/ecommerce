import ConditionalFooter from "./ConditionalFooter";
import Header from "@/components/layout/Header";

// Header and Footer wrap every page. The shell is a flex column so the
// footer is pushed to the bottom and the page content fills the space in
// between — pages should grow with `flex-1` rather than set `min-h-screen`,
// which would stack a second viewport-height block and force a scrollbar.
export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main className="flex flex-1 flex-col">{children}</main>
      <ConditionalFooter />
    </div>
  );
}
