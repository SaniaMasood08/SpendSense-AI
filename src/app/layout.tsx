import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"SpendSense — Money, made mindful",description:"A calmer way to see where your money goes."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
