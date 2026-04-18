export const BACK_URL = process.env.NEXT_PUBLIC_BACK_URL;
export const BASIC_USER = process.env.NEXT_PUBLIC_BASIC_USER;
export const BASIC_PASS = process.env.NEXT_PUBLIC_BASIC_PASS;

export function getAuthHeaders() {
  if (!BASIC_USER || !BASIC_PASS) {
    return {};
  }

  return {
    Authorization: `Basic ${btoa(`${BASIC_USER}:${BASIC_PASS}`)}`,
  };
}