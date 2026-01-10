"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className="w-9 h-9 rounded-full relative overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Sun
                            className={`h-5 w-5 transition-all duration-300 ${isDark
                                    ? "rotate-90 scale-0 opacity-0"
                                    : "rotate-0 scale-100 opacity-100"
                                }`}
                        />
                        <Moon
                            className={`absolute h-5 w-5 transition-all duration-300 ${isDark
                                    ? "rotate-0 scale-100 opacity-100"
                                    : "-rotate-90 scale-0 opacity-0"
                                }`}
                        />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
