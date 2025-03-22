import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, Heart } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loan Manager | Facial Verification System",
  description:
    "Secure facial verification system for bank loan applications using face-api.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b py-3 px-4">
          <div className="flex items-center max-w-7xl mx-auto">
            <Link className="flex gap-2 items-center" href="/">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <NavigationMenu className="ml-4">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="px-2 text-md font-normal">
                    Pages
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[250px] p-2 space-y-1">
                      <NavigationMenuLink asChild>
                        <Link
                          className="text-sm flex w-full items-center rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                          href="/account"
                        >
                          Account
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          className="text-sm flex w-full items-center rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                          href="/ai-chatbot"
                        >
                          AI Chatbot
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          className="text-sm flex w-full items-center rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                          href="/manager-dashboard"
                        >
                          Manager Dashboard
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          className="text-sm flex w-full items-center rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                          href="/application-success"
                        >
                          Success Page
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          className="text-sm flex w-full items-center rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                          href="/emotional-support"
                        >
                          <Heart className="h-4 w-4 mr-2 text-red-500" />{" "}
                          Emotional Support
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          className="text-sm flex w-full items-center rounded px-2 py-1.5 hover:bg-accent hover:text-accent-foreground"
                          href="/multi-support"
                        >
                          Multi-Language Support
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
