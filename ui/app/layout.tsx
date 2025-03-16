import type { Metadata } from "next";
import { Roboto_Mono, Vina_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./languagecontext";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

const vinaSans = Vina_Sans({
  variable: "--font-vina-sans",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "Studentischer Filmclub Heidelberg",
  description: "Die Website des Studentischen Filmclubs Heidelberg",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${robotoMono.variable} ${vinaSans.variable}`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
