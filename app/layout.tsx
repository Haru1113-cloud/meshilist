import type { Metadata } from "next";
import { Montserrat, Noto_Sans_JP, Pacifico } from "next/font/google";
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
    <html lang="ja">
      <body className={`${montserrat.variable} ${notoSansJP.variable} ${pacifico.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
