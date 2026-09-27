export const languages = [
  {
    title: "EN",
    image: "/en.svg",
  },
  {
    title: "IT",
    image: "/it.svg",
  },
];

// Password strength calculation
  export const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };