"use client";

import React, { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown, Check } from "lucide-react";
import { languages } from "@/utils/constants";
import { setUserLocale } from "@/i18n/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageItem {
  title: string;
  image: string;
}

export function SwitchLanguage() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentLanguage: LanguageItem =
    languages.find(
      (lang) => lang.title.toLowerCase() === locale?.toLowerCase()
    ) || languages[0];

  const handleSwitchLocale = (langTitle: string) => {
    const nextLocale = langTitle.toLowerCase();
    startTransition(async () => {
      await setUserLocale(nextLocale);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
          >
            {currentLanguage?.image && (
              <Image
                src={currentLanguage.image}
                alt={currentLanguage.title}
                width={18}
                height={14}
                className="rounded-xs object-cover"
              />
            )}
            <span className="uppercase">{currentLanguage?.title}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-32">
        {languages.map((lang) => {
          const isSelected =
            lang.title.toLowerCase() === currentLanguage?.title.toLowerCase();
          return (
            <DropdownMenuItem
              key={lang.title}
              onClick={() => handleSwitchLocale(lang.title)}
              className="flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {lang.image && (
                  <Image
                    src={lang.image}
                    alt={lang.title}
                    width={18}
                    height={14}
                    className="rounded-xs object-cover"
                  />
                )}
                <span className="uppercase">{lang.title}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default SwitchLanguage;
