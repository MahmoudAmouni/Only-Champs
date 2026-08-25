import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px] space-y-8">
        <Link
          href="/"
          className="block text-center font-display text-2xl font-bold tracking-[-0.02em] text-foreground"
        >
          OnlyChamps
        </Link>
        {children}
      </div>
    </div>
  );
}
