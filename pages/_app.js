import { ThirdwebProvider } from "@thirdweb-dev/react";
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

// This is the chain your dApp will work on.
// Change this to the chain your app is built for.
// You can also import additional chains from `@thirdweb-dev/chains` and pass them directly.
const activeChain = "binance";

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider activeChain={activeChain}>
      <Head>
        <title>Chance Exchange</title>
      </Head>
      <Component {...pageProps} />
      <Toaster></Toaster>
    </ThirdwebProvider>
  );
}

export default MyApp;
