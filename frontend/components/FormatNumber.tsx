import { useFormatter } from "next-intl";

interface FormatNumberProps {
  number: number | string;
}

interface FormatCurrencyProps {
  number: number | string;
  currency?: string;
}

export const FormatNumber = ({ number }: FormatNumberProps) => {
  const format = useFormatter();
  const numValue = typeof number === "string" ? Number(number) : number;
  return format.number(numValue);
};

export const FormatCurrency = ({
  number,
  currency = "USD",
}: FormatCurrencyProps) => {
  const format = useFormatter();
  const numValue = typeof number === "string" ? Number(number) : number;
  return format.number(numValue, { style: "currency", currency });
};
