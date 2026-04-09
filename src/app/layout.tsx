import type { Metadata } from "next";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import TabNav from "@/components/layout/TabNav";
import CommandPalette from "@/components/layout/CommandPalette";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Forge",
  description: "Tasks, Email, and CRM — your operational surface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-gray-900 antialiased font-sans">
        <ConvexClientProvider>
          <ToastProvider>
            <div className="h-full flex flex-col">
              <TabNav />
              <main className="flex-1 overflow-hidden">{children}</main>
            </div>
            <CommandPalette />
          </ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
