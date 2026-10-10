import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const title = "Ailaan — Flood Alerts for Khyber Pakhtunkhwa";
const description =
  "Ailaan turns satellite flood data into spoken warnings in Pashto, Roman Pashto and English — built for communities, not control rooms.";

export const metadata = {
  metadataBase: getSiteUrl(),
  title,
  description,
  openGraph: {
    type: "website",
    siteName: "Ailaan",
    title,
    description,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-ink text-mist">
        {children}
      </body>
    </html>
  );
}
