import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignUp Page | Dropiti Admin Console",
  description: "This is SignUp Page Dropiti Admin Console",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
