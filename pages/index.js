import { useState, useEffect } from "react";
import {
  useDisconnect,
  useNetworkMismatch,
  useSwitchChain,
  ConnectWallet,
  useAddress,
  useContract,
  useTokenBalance,
  useContractRead,
  useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { Goerli, BinanceTestnet, Binance } from "@thirdweb-dev/chains";

// check use chance balance
// check use betToken balance
// button and input to deposit $chance and receive betToken
// button and input to swap bettoken to $chance

export default function Home() {
  const [depositAmount, setDepositAmount] = useState("");
  console.log("🚀 ~ file: index.js:22 ~ Home ~ depositAmount:", depositAmount);
  const [cashOutAmount, setCashOutAmount] = useState("");

  const disconnect = useDisconnect();
  const isMismatched = useNetworkMismatch();

  const switchChain = useSwitchChain();

  const address = useAddress();
  console.log("🚀 ~ file: index.js:23 ~ Home ~ address:", address);

  const {
    contract: exchangeContract,
    isLoading,
    error,
  } = useContract(process.env.NEXT_PUBLIC_EXCHANGE_CONTRACT_ADDRESS);
  console.log(
    "🚀 ~ file: index.js:25 ~ Home ~ exchangeContract:",
    exchangeContract
  );

  const {
    contract: chanceContract,
    isLoading: chanceIsLoading,
    error: chanceError,
  } = useContract(process.env.NEXT_PUBLIC_MAIN_TOKEN_CONTRACT_ADDRESS, "token");
  console.log(
    "🚀 ~ file: index.js:31 ~ Home ~ chanceContract:",
    chanceContract
  );

  const {
    contract: betContract,
    isLoading: betIsLoading,
    error: betError,
  } = useContract(process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS, "token");
  console.log("🚀 ~ file: index.js:39 ~ Home ~ betContract:", betContract);

  const { mutateAsync: depositChance, isLoading: depositIsLoading } =
    useContractWrite(exchangeContract, "depositChance");
  const { mutateAsync: cashOutBetTokens, isLoading: cashOutIsLoading } =
    useContractWrite(exchangeContract, "cashOutBetTokens");

  const { data: chanceBalance } = useTokenBalance(chanceContract, address);
  console.log("🚀 ~ file: index.js:70 ~ Home ~ chanceBalance:", chanceBalance);

  const { data: betTokenBalance } = useTokenBalance(betContract, address);
  console.log(
    "🚀 ~ file: index.js:69 ~ Home ~ betTokenBalance:",
    betTokenBalance
  );

  const { data: exchangeChanceBalance } = useTokenBalance(
    chanceContract,
    process.env.NEXT_PUBLIC_EXCHANGE_CONTRACT_ADDRESS
  );
  console.log(
    "🚀 ~ file: index.js:62 ~ Home ~ exchangeChanceBalance:",
    exchangeChanceBalance
  );

  const { data: exchangeBetBalance } = useTokenBalance(
    betContract,
    process.env.NEXT_PUBLIC_EXCHANGE_CONTRACT_ADDRESS
  );
  console.log(
    "🚀 ~ file: index.js:68 ~ Home ~ exchangeBetBalance:",
    exchangeBetBalance
  );

  const { data: allow } = useContractRead(chanceContract, "allowance", [
    address,
    process.env.NEXT_PUBLIC_EXCHANGE_CONTRACT_ADDRESS,
  ]);
  const { mutateAsync: approve } = useContractWrite(chanceContract, "approve");

  async function depositToken() {
    const notification = toast.loading(
      `Exchanging to ${betTokenBalance?.symbol}`
    );
    try {
      if (exchangeBetBalance?.displayValue < depositAmount) {
        alert(`Insufficient ${betTokenBalance?.symbol} to swap to`);
        toast.error(`Insufficient ${betTokenBalance?.symbol} to swap to`, {
          id: notification,
        });
      } else {
        try {
          if (allow.toString() === "0" || allow.toString() < depositAmount) {
            try {
              const approveData = await approve({
                args: [
                  process.env.NEXT_PUBLIC_EXCHANGE_CONTRACT_ADDRESS,
                  depositAmount,
                ],
              });
              console.log(
                "🚀 ~ file: page.js:182 ~ handleClick ~ approveData:",
                approveData
              );
              toast.success(`approved successfully`, {
                id: notification,
              });
            } catch (e) {
              toast.error(`Whoops something went wrong approving`, {
                id: notification,
              });
              console.log("🚀 ~ file: index.js:141 ~ allow.toString ~ e:", e);
            }
          } else {
            try {
              const parsedAmount = ethers.utils.parseUnits(
                depositAmount,
                chanceBalance?.decimals
              );
              const data = await depositChance({
                args: [parsedAmount],
              });
              toast.success(
                `${depositAmount} ${chanceBalance?.symbol} successfully exchanged for ${depositAmount} ${betTokenBalance?.symbol}`,
                {
                  id: notification,
                }
              );
              console.info("contract call success", data);
            } catch (err) {
              toast.error(`Whoops ${err.reason}`, {
                id: notification,
              });
              console.log("error", err.reason);
              console.error("contract call failure", err);
            }
          }
        } catch (e) {
          toast.error(`Whoops something went wrong ${e}`, {
            id: notification,
          });
          console.log("🚀 ~ file: index.js:111 ~ depositToken ~ e:", e);
        }
      }
    } catch (e) {
      toast.error(`Whoops something went wrong ${e}`, {
        id: notification,
      });
      console.log("🚀 ~ file: index.js:133 ~ cashOutToken ~ e:", e);
    }
  }

  async function cashOutToken() {
    const notification = toast.loading(
      `Cashing Out Your ${chanceBalance?.symbol}`
    );
    try {
      const parsedAmount = ethers.utils.parseUnits(
        cashOutAmount,
        betTokenBalance?.decimals
      );
      const data = await cashOutBetTokens({
        args: [cashOutAmount],
      });
      toast.success(
        `${cashOutAmount} ${betTokenBalance?.symbol} successfully exchanged for ${cashOutAmount} ${chanceBalance?.symbol}`,
        {
          id: notification,
        }
      );
      console.info("contract call success", data);
    } catch (err) {
      toast.error(`Whoops ${err.reason}`, {
        id: notification,
      });
      console.log("error", err.reason);
      console.error("contract call failure", err);
    }
  }

  const handleDeposit = (event) => {
    let num = Number(chanceBalance?.displayValue).toFixed(2);
    if (event.target.value.length > num.length) {
      setDepositAmount(Number(chanceBalance?.displayValue).toFixed(2));
    } else {
      setDepositAmount(event.target.value);
    }
  };

  const handleCashOut = (event) => {
    let num = Number(betTokenBalance?.displayValue).toFixed(2);
    if (event.target.value.length > num.length) {
      setCashOutAmount(Number(betTokenBalance?.displayValue).toFixed(2));
    } else {
      setCashOutAmount(event.target.value);
    }
  };

  async function networkCheck() {
    if (isMismatched) {
      switchChain(Binance.chainId);
    }
  }

  useEffect(() => {
    networkCheck();
  }, [address, exchangeContract]);

  useEffect(() => {}, [address]);

  return (
    <main className="min-h-screen py-8 px-6 md:px-12 lg:px-16">
      <div className="flex justify-end">
        <ConnectWallet />
      </div>

      {isLoading || betIsLoading || chanceIsLoading ? (
        <>Loading...</>
      ) : (
        <>
          {address ? (
            <div className="bg-gray-900 px-6 rounded-lg flex flex-col mt-8 pb-8">
              <div className="text-yellow-500 mt-6">
                Your {chanceBalance && chanceBalance?.symbol} Balance
              </div>
              <div className="mt-1 flex">
                <div>
                  {" "}
                  {chanceBalance &&
                    Number(chanceBalance?.displayValue).toFixed(2)}
                </div>
                <div className="text-yellow-300 ml-2">
                  {chanceBalance && chanceBalance?.symbol}
                </div>
              </div>
              <div className="text-yellow-500 mt-2">
                Your {betTokenBalance && betTokenBalance?.symbol} Balance
              </div>
              <div className="mt-1 flex">
                <div>
                  {" "}
                  {betTokenBalance &&
                    Number(betTokenBalance?.displayValue).toFixed(2)}{" "}
                </div>
                <div className="text-yellow-300 ml-2">
                  {" "}
                  {betTokenBalance && betTokenBalance?.symbol}
                </div>
              </div>
              {/* deposit chance to get betToken */}
              <div className="flex flex-col mt-2">
                <input
                  className="outline-none rounded-md text-black px-2 py-1 w-64"
                  type="number"
                  disabled={
                    Number(chanceBalance?.displayValue).toFixed(2) == "0.00" ||
                    depositIsLoading
                  }
                  min={1}
                  max={chanceBalance?.displayValue}
                  value={depositAmount}
                  onChange={handleDeposit}
                />

                <button
                  className="my-4 bg-yellow-500 py-1.5 w-fit px-6 rounded-2xl disabled:opacity-50 "
                  disabled={
                    Number(chanceBalance?.displayValue).toFixed(2) == "0.00" ||
                    depositIsLoading ||
                    depositAmount > exchangeBetBalance?.displayValue ||
                    Number(exchangeBetBalance?.displayValue).toFixed(2) ==
                      "0.00"
                  }
                  onClick={depositToken}>
                  {Number(exchangeBetBalance?.displayValue).toFixed(2) ==
                    "0.00" ||
                  Number(exchangeBetBalance?.displayValue).toFixed(2) <
                    Number(depositAmount).toFixed(2) ? (
                    <>
                      Not enough {exchangeBetBalance?.symbol} to match your
                      request
                    </>
                  ) : (
                    <>
                      {chanceBalance?.displayValue == "0.00"
                        ? `You don't have ${chanceBalance?.symbol} to Swap`
                        : `Swap ${chanceBalance?.symbol} to ${betTokenBalance?.symbol}`}
                    </>
                  )}
                </button>
              </div>

              {/* withdraw chance by depositing betToken */}
              <div className="flex flex-col items-start">
                <div className=" text-yellow-500">
                  Swapping from {betTokenBalance?.symbol} to {chanceBalance?.symbol}
                </div>
                <input
                  className="outline-none rounded-md text-black px-2 py-1 w-64 mt-2"
                  type="number"
                  disabled={
                    Number(betTokenBalance?.displayValue).toFixed(2) ==
                      "0.00" || cashOutIsLoading
                  }
                  min={1}
                  max={betTokenBalance?.displayValue}
                  value={cashOutAmount}
                  onChange={handleCashOut}
                />

                <button
                  className=" my-4 bg-yellow-500 py-1.5 w-fit px-6 rounded-2xl disabled:opacity-50"
                  disabled={
                    Number(betTokenBalance?.displayValue).toFixed(2) ==
                      "0.00" ||
                    cashOutIsLoading ||
                    cashOutAmount > exchangeChanceBalance?.displayValue ||
                    Number(exchangeChanceBalance?.displayValue).toFixed(2) ==
                      "0.00"
                  }
                  onClick={cashOutToken}>
                  {Number(exchangeChanceBalance?.displayValue).toFixed(2) ==
                    "0.00" ||
                  Number(exchangeChanceBalance?.displayValue).toFixed(2) <
                    Number(depositAmount).toFixed(2) ? (
                    <>
                      Not enough {exchangeChanceBalance?.symbol} to match your
                      request
                    </>
                  ) : (
                    <>
                      {betTokenBalance?.displayValue == "0.00"
                        ? `You don't have ${betTokenBalance?.symbol} to swap`
                        : `Swap ${betTokenBalance?.symbol} to ${chanceBalance?.symbol}`}
                    </>
                  )}
                </button>
              </div>

              <div className="text-yellow-500">
                Exchange{" "}
                {exchangeChanceBalance && exchangeChanceBalance?.symbol} Balance
              </div>
              <div className="flex mt-1 ">
                <div>
                  {exchangeChanceBalance &&
                    Number(exchangeChanceBalance?.displayValue).toFixed(2)}
                </div>
                <div className="text-yellow-300 ml-2">
                  {exchangeChanceBalance && exchangeChanceBalance?.symbol}
                </div>
              </div>
              <div className="text-yellow-500 mt-2">
                Exchange {exchangeBetBalance && exchangeBetBalance?.symbol}{" "}
                Balance
              </div>
              <div className="flex mt-1">
                <div>
                  {" "}
                  {exchangeBetBalance &&
                    Number(exchangeBetBalance?.displayValue).toFixed(2)}{" "}
                </div>
                <div className="text-yellow-300 ml-2">
                  {" "}
                  {exchangeBetBalance && exchangeBetBalance?.symbol}
                </div>
              </div>
            </div>
          ) : (
            <>Please Connect Your Wallet</>
          )}
        </>
      )}
    </main>
  );
}
