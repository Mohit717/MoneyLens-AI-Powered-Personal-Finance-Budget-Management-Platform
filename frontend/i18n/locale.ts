'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'NEXT_LOCALE';

export async function getUserLocale() {
  const cookiesInstance = await cookies();
  const cookie = cookiesInstance.get(COOKIE_NAME);
  return cookie?.value || 'en';
}

export async function setUserLocale(locale: string) {
  const cookiesInstance = await cookies();
  await cookiesInstance.set(COOKIE_NAME, locale);
}
