import { redirect } from "next/navigation";

// The preconfigured scenarios page is the default landing spot; switch between
// the other flows via the nav bar.
export default function Home() {
  redirect("/scenarios");
}
