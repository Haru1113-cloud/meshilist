import type { Metadata, Viewport } from "next";
import { Montserrat, Noto_Sans_JP, Pacifico } from "next/font/google";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: ["400"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "メシリスト — 今夜の献立、AIに決めてもらおう",
  description: "食材を入力するだけで、1週間分の献立と買い物リストをAIが自動生成。忙しい家庭の献立疲れを解消します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={jaJP}>
      <html lang="ja">
        <head>
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-11KCD8NZVD" strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-11KCD8NZVD');
          `}</Script>
        </head>
        <body className={`${montserrat.variable} ${notoSansJP.variable} ${pacifico.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
