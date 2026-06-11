import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo2 = Baloo_2({
  variable: "--font-baloo2",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spinout — Social Activity Roulette",
  description: "Découvre ta prochaine activité avec tes amis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${baloo2.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink relative overflow-x-hidden">
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="fixed top-0 right-0 w-[300px] h-[300px] pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(circle, #F2A03D55, transparent 68%)",
          }}
        />
        <div
          aria-hidden
          className="fixed bottom-0 left-0 w-[340px] h-[340px] pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(circle, #E8643C44, transparent 68%)",
          }}
        />

        <div className="relative z-10 flex flex-col flex-1">{children}</div>
      </body>
    </html>
  );
}
