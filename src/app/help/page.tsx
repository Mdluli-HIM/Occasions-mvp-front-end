import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & how it works | Occasions",
  description: "Get started with planning an event, choosing services and managing your provider listing on Occasions.",
};

const PLANNING_STEPS = [
  {
    title: "Start with your occasion",
    description: "Choose your event type, area, date, guest count and the services you need. Choose Other if your occasion is not listed.",
  },
  {
    title: "Find the right services",
    description: "Browse providers by category and area. Explore their profiles, photos and packages, then add the services you want to your cart.",
  },
  {
    title: "Keep your requests together",
    description: "Link services to your saved event and review the details in your cart. Send booking requests, then track each provider’s response in My events or My bookings.",
  },
];

const PROVIDER_STEPS = [
  {
    title: "Introduce yourself or your company",
    description: "Log in or create an account, then choose whether you provide services as an individual or a company. Add your public profile and the areas you serve.",
  },
  {
    title: "Show what you offer",
    description: "Add your service details, portfolio photos and packages with prices. Preview your listing, then publish it when you are ready.",
  },
  {
    title: "Manage your bookings",
    description: "Review your own incoming requests in Provider bookings. Confirm or decline them, and mark confirmed services as completed after the event.",
  },
];

const QUESTIONS = [
  {
    question: "Does sending a request confirm my booking?",
    answer: "Each provider reviews their request separately. A request stays pending until that provider confirms it. Check the status of each service before your event.",
  },
  {
    question: "Can I arrange several services for one event?",
    answer: "Yes. Save one event and link your chosen services to it. Each service keeps its own booking and status, so you can follow the whole plan from My events.",
  },
  {
    question: "Do I have to create an event to book a service?",
    answer: "You can also choose a standalone service. Select its date, time and guest count in your cart without linking it to a saved event.",
  },
  {
    question: "Is payment collected when I send a booking request?",
    answer: "Occasions currently sends booking requests without collecting payment. The prices shown are service values. Each provider confirms their own availability.",
  },
];

const actionClass = "inline-flex items-center justify-center rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral";

export default function HelpPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-medium text-coral">Your occasion, brought together</p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Help & how it works</h1>
        <p className="mt-4 text-base leading-7 text-ink/65">
          Occasions brings event planners and service providers in Limpopo together.
          Find the services you need and keep your event’s bookings in one place.
        </p>
      </div>

      <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
        <Guide id="planning" title="For event planners" steps={PLANNING_STEPS}>
          <Link href="/events/new" className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral">Plan an event</Link>
          <Link href="/search" className={actionClass}>Browse services</Link>
        </Guide>
        <Guide id="providers" title="For providers" steps={PROVIDER_STEPS}>
          <Link href="/provider/listings/new" className={actionClass}>List your services</Link>
          <Link href="/provider/bookings" className={actionClass}>Provider bookings</Link>
        </Guide>
      </div>

      <section aria-labelledby="questions-heading" className="mt-14 border-t border-black/10 pt-10">
        <h2 id="questions-heading" className="text-2xl font-semibold text-ink">Common questions</h2>
        <div className="mt-6 divide-y divide-black/10">
          {QUESTIONS.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="cursor-pointer rounded-sm text-sm font-medium leading-6 text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral">
                {item.question}
              </summary>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/65">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function Guide({ id, title, steps, children }: {
  id: string;
  title: string;
  steps: { title: string; description: string }[];
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-8">
      <h2 id={`${id}-heading`} className="text-xl font-semibold text-ink">{title}</h2>
      <ol className="mt-6 space-y-6">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-xs font-semibold text-ink">{index + 1}</span>
            <div>
              <h3 className="text-sm font-medium leading-6 text-ink">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-ink/65">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-7 flex flex-wrap gap-3">{children}</div>
    </section>
  );
}
