"use client";

import { useTranslations } from "next-intl";

interface TranslateProps {
  text: string;
}

const Translate = ({ text }: TranslateProps) => {
  const t = useTranslations();
  return t(text);
};

export default Translate;
