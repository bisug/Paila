import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "../styles.css";

export const metadata: Metadata = {
  title: "Paila | Every Journey Begins with a Step",
  description: "Offline-first Nepal tourism for direct community travel.",
  openGraph: {
    title: "Paila | Every Journey Begins with a Step",
    description: "Offline-first Nepal tourism for direct community travel.",
    type: "website",
    images: [
      {
        url: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dd1c7a6b-4b9f-459f-a2dc-889b7e90645a/id-preview-b5dc5265--eb532f5f-a0ec-4495-8830-c6a378d31227.lovable.app-1780195018327.png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Paila | Every Journey Begins with a Step",
    description: "Offline-first Nepal tourism for direct community travel.",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/dd1c7a6b-4b9f-459f-a2dc-889b7e90645a/id-preview-b5dc5265--eb532f5f-a0ec-4495-8830-c6a378d31227.lovable.app-1780195018327.png",
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#F9F8F6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-stone-100 antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
