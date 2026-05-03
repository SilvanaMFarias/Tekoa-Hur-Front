export const fetchAuth = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    credentials: "include", // 🔥 usa cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    window.location.href = "/login";
  }

  return res;
};