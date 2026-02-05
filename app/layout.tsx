import type { Metadata } from "next";
import "./globals.css";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";

export const metadata: Metadata = {
    title: "TheLeadSpin | Spin & Win | Exclusive Offers",
    description: "TheLeadSpin – Spin the wheel to win exciting prizes and exclusive discounts!",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="light">
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
            </head>
            <body className="antialiased min-h-screen bg-[#f8f7f5] text-[#181411] transition-colors duration-300" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                <NextSSRPlugin
                    routerConfig={extractRouterConfig(ourFileRouter)}
                />
                {children}
            </body>
        </html>
    );
}
