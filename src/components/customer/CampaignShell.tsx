import type { ReactNode } from "react";
import { config } from "../../lib/config";
import logo from "../../assest/logo.png";

/** Mobile-first backdrop (public/bg_print.webp) shared by all customer pages. */
export function CampaignShell({ children }: { children: ReactNode }) {
  return (
    <div className="campaign-bg relative text-white">
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {/* Logo + page content start near the top, so the gap between them stays small */}
        <div className="flex flex-1 flex-col justify-start pt-2">
          <header className="mb-8 flex justify-center">
            <img
              src={logo}
              alt={config.campaignName}
              width={562}
              height={720}
              className="h-[clamp(6.5rem,20svh,12rem)] w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
            />
          </header>
          <main className="flex flex-col">{children}</main>
        </div>
      </div>
    </div>
  );
}
