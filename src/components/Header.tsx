"use client";

interface HeaderProps {
  instagramId?: string;
  status?: string;
}

export default function Header({ instagramId, status }: HeaderProps) {
  return (
    <header className="w-full px-5 py-4 flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="font-semibold text-[var(--foreground)]">payge</span>
      {instagramId && (
        <>
          <span>·</span>
          <span>@{instagramId}</span>
        </>
      )}
      {status && (
        <>
          <span>·</span>
          <span>{status}</span>
        </>
      )}
    </header>
  );
}
