"use client";

import { useRouter } from "next/navigation";

export function JobTableRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-indigo-50/40"
      onClick={() => router.push(href)}
    >
      {children}
    </tr>
  );
}
