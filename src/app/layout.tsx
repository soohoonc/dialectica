import type { Metadata } from "next";
import { Source_Serif_4, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/providers/theme";
import { TRPCProvider } from "@/providers/trpc";
import { CommandMenu } from "@/components/navigation/command-menu";
import "@/styles/globals.css";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dialectica",
  description: "Discussions of humanity - exploring the conversation of ideas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${sourceSerif.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            {children}
            <CommandMenu />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
