import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { Advertisement } from '../lib/types';

interface SponsorCardProps {
  ad: Advertisement;
}

/**
 * Renders an advertisement inside a CeylonPlay-branded "Future Sponsor" card.
 * The ad code (raw HTML/JS from any ad network) is injected via
 * dangerouslySetInnerHTML. The card auto-sizes to the ad content — no cropping
 * or stretching. Works for any banner size or HTML/JS format.
 *
 * Script tags inside the ad_code are handled by re-injecting them after render,
 * since dangerouslySetInnerHTML does not execute <script> tags.
 */
export function SponsorCard({ ad }: SponsorCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Re-execute any <script> tags that were inserted via innerHTML
    // (browsers don't run scripts inserted this way automatically)
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      for (let i = 0; i < oldScript.attributes.length; i++) {
        const attr = oldScript.attributes[i];
        newScript.setAttribute(attr.name, attr.value);
      }
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [ad.ad_code]);

  return (
    <div className="w-full">
      {/* Future Sponsor label */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Sparkles className="h-3 w-3 text-brand-400" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
          Future Sponsor
        </span>
      </div>

      {/* Glassmorphism card */}
      <div
        className="
          relative rounded-2xl overflow-hidden
          border border-border
          bg-gradient-to-br from-bg-card/80 via-bg-card/60 to-bg-elevated/40
          backdrop-blur-xl
          shadow-lg shadow-black/20
          transition-all duration-300
        "
      >
        {/* Subtle glow accent */}
        <div className="absolute -top-px left-1/2 -translate-x-1/2 h-px w-3/4 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />

        {/* Ad content container — auto-sizes to ad */}
        <div
          ref={containerRef}
          className="w-full min-h-[50px] flex items-center justify-center p-3 sm:p-4 [&_iframe]:max-w-full [&_img]:max-w-full [&_img]:h-auto [&_ins]:max-w-full [&_div]:max-w-full"
          dangerouslySetInnerHTML={{ __html: ad.ad_code }}
        />
      </div>
    </div>
  );
}
