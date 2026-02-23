import { ViewsShell } from "@/components/navigation/views-shell";

export default function ViewsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ViewsShell>{children}</ViewsShell>;
}
