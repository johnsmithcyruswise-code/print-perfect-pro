import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const next = localStorage.getItem("bazz-theme") === "dark";
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  }, []);
  return <Button variant="outline" size="icon" className="size-12" title={dark ? "Light mode" : "Dark mode"} aria-label={dark ? "Light mode" : "Dark mode"} onClick={() => { const next = !dark; setDark(next); localStorage.setItem("bazz-theme", next ? "dark" : "light"); document.documentElement.classList.toggle("dark", next); }}>{dark ? <Sun /> : <Moon />}</Button>;
}