import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "Ailaan — Flood Alerts for Khyber Pakhtunkhwa",
  description:
    "Ailaan turns satellite flood data into spoken warnings in Pashto, Roman Pashto and English — built for communities, not control rooms.",
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
