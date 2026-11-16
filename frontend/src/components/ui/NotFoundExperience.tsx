import Link from "next/link";
import { SearchX } from "lucide-react";

export function NotFoundExperience({
  title = "Page not found",
  description = "This route does not exist in the Customer Success console.",
  href = "/dashboard",
  actionLabel = "Back to dashboard",
}: {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="border-border bg-surface text-text-muted mb-5 flex size-14 items-center justify-center rounded-full border">
        <SearchX className="size-6" />
      </div>
      <p className="num text-primary text-xs font-medium tracking-[0.2em]">404</p>
      <h1 className="text-text mt-2 text-xl font-semibold sm:text-2xl">{title}</h1>
      <p className="text-text-muted mt-2 max-w-md text-sm">{description}</p>
      <Link
        href={href}
        className="bg-primary hover:bg-primary-hover text-text mt-6 inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
