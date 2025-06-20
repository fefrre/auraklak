import type { AppProps } from "next/app";
import "@/styles/globals.css"; // Asegúrate de tener esto
import { Special_Elite } from "next/font/google";
import '../styles/embla.css'
import '../styles/embla-carousel.css'

// 🎯 Carga la fuente estilo máquina de escribir
const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-special",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={specialElite.variable + " font-machine"}>
      <Component {...pageProps} />
    </main>
  );
}
