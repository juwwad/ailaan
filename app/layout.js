import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { siteMetadata } from "@/lib/metadata";
import "./globals.css";

export const metadata = siteMetadata();

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
