import Link from "next/link";
import { Globe } from "lucide-react";

const FOOTER_SECTIONS = [
  {
    title: "For event planners",
    links: [
      { href: "/search", label: "Browse services" },
      { href: "/events/new", label: "Plan an event" },
      { href: "/events", label: "My events" },
      { href: "/profile#bookings", label: "My bookings" },
    ],
  },
  {
    title: "For providers",
    links: [
      { href: "/provider/listings/new", label: "List your services" },
      { href: "/provider/listings", label: "Manage your listing" },
      { href: "/provider/bookings", label: "Provider bookings" },
      { href: "/help#providers", label: "Getting started" },
    ],
  },
  {
    title: "Occasions",
    links: [
      { href: "/help", label: "Help & how it works" },
      { href: "/profile", label: "Your account" },
      { href: "/signup", label: "Create an account" },
    ],
  },
];

const linkClass =
  "rounded-sm text-sm leading-6 text-[#A6B6C2] transition-colors duration-150 hover:text-white hover:underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral";

export function SiteFooter() {
  return (
    <footer className="mt-auto w-full shrink-0 bg-[#071A28] text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 py-12 sm:gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16 lg:py-16">
          <div className="min-w-0">
            <Link
              href="/"
              prefetch={false}
              className="inline-block rounded-sm text-3xl font-extrabold tracking-tight text-coral focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral sm:text-4xl"
            >
              Occasions
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-7 text-[#A6B6C2] sm:text-base">
              Find and book event service providers for your occasion.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid min-w-0 gap-8 sm:grid-cols-3 sm:gap-8"
          >
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title} className="min-w-0">
                <h2 className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] leading-5 text-[#D1DCE4]">
                  {section.title}
                </h2>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={false}
                        className={linkClass}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/10 py-6 text-sm text-[#A6B6C2] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Occasions</p>
          <div className="flex flex-wrap items-center gap-6 text-[#D1DCE4]">
            <span className="inline-flex items-center gap-2">
              <Globe size={17} aria-hidden="true" />
              English
            </span>
            <span aria-label="Currency: South African rand">R ZAR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
