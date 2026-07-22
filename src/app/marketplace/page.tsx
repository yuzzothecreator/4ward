import { Suspense } from "react";
import MarketplacePage from "./marketplace-client";

export const metadata = {
  title: "Marketplace",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Loading marketplace...</div>}>
      <MarketplacePage />
    </Suspense>
  );
}
