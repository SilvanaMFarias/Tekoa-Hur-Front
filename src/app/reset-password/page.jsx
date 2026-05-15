import ResetPasswordClient from "./ResetPasswordClient";

export default function Page({ searchParams }) {
  return (
    <ResetPasswordClient
      token={searchParams.token}
      email={searchParams.email}
    />
  );
}