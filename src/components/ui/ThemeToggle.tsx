import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const ThemeToggle: React.FC = () => {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // avoid hydration mismatch
        return (
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 pointer-events-none" aria-hidden />
        );
    }

    const isDark = resolvedTheme === "dark";
    const toggle = () => setTheme(isDark ? "light" : "dark");

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle} aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}>
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{isDark ? "Switch to light" : "Switch to dark"}</TooltipContent>
        </Tooltip>
    );
};

export default ThemeToggle;
