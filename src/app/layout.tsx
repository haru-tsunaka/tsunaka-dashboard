import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import InactivityGuard from "@/components/InactivityGuard";

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "繋叶 Hitoha",
  description: "繋叶 Hitoha — いまと、これからを、ひとはにのせて。",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-180x180.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hitoha",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSerifJP.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Header />
        <InactivityGuard />
        <main className="flex-1">{children}</main>
        <script
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js")`,
          }}
        />
      </body>
    </html>
  );
}
