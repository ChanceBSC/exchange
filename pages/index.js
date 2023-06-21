import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import {
  ConnectWallet,
  useAddress,
  useWallet,
  useContract,
  useTokenBalance,
  useContractRead,
  useContractWrite,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

// check use chance balance
// check use betToken balance
// button and input to deposit $chance and receive betToken
// button and input to swap bettoken to $chance

export default function Home() {
  const [depositAmount, setDepositAmount] = useState();
  console.log("🚀 ~ file: index.js:22 ~ Home ~ depositAmount:", depositAmount)
  const [cashOutAmount, setCashOutAmount] = useState();

  const address = useAddress();
  console.log("🚀 ~ file: index.js:23 ~ Home ~ address:", address);

  const {
    contract: exchangeContract,
    isLoading,
    error,
  } = useContract("0x895d9064081c15eF4A92eD93B96c2AaB421D2e8A");
  console.log(
    "🚀 ~ file: index.js:25 ~ Home ~ exchangeContract:",
    exchangeContract
  );

  const {
    contract: chanceContract,
    isLoading: chanceIsLoading,
    error: chanceError,
  } = useContract("0x9D45E3a41F714f655846AA145b27676e5258C113", "token");
  console.log(
    "🚀 ~ file: index.js:31 ~ Home ~ chanceContract:",
    chanceContract
  );

  const {
    contract: betContract,
    isLoading: betIsLoading,
    error: betError,
  } = useContract("0xc81DAb876618350bf299A152F0676A7fCB920e0b", "token");
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
    "0x895d9064081c15eF4A92eD93B96c2AaB421D2e8A"
  );
  console.log(
    "🚀 ~ file: index.js:62 ~ Home ~ exchangeChanceBalance:",
    exchangeChanceBalance
  );

  const { data: exchangeBetBalance } = useTokenBalance(
    betContract,
    "0x895d9064081c15eF4A92eD93B96c2AaB421D2e8A"
  );
  console.log(
    "🚀 ~ file: index.js:68 ~ Home ~ exchangeBetBalance:",
    exchangeBetBalance
  );

  async function depositToken() {
    const notification = toast.loading(
      `Exchanging to ${betTokenBalance?.symbol}`
    );
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
        args: [parsedAmount],
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

  useEffect(() => {
  
  }, [address])

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <ConnectWallet />
        {address ? (
          <div>
            <div>
              <p>chance balance</p>
              {chanceBalance &&
                Number(chanceBalance?.displayValue).toFixed(2)}{" "}
              {""}
              {chanceBalance && chanceBalance?.symbol}
              <p>betToken contract</p>
              {betTokenBalance &&
                Number(betTokenBalance?.displayValue).toFixed(2)}{" "}
              {""}
              {betTokenBalance && betTokenBalance?.symbol}
            </div>
            <hr></hr>
            <div>
              {/* deposit chance to get betToken */}
              <input
                type="number"
                disabled={
                  Number(chanceBalance?.displayValue).toFixed(2) == "0.0" ||
                  depositIsLoading ||
                  exchangeBetBalance?.displayValue <=
                    chanceBalance?.displayValue
                }
                min={1}
                max={chanceBalance?.displayValue}
                value={depositAmount}
                onChange={handleDeposit}
              />
              <br />
              <button
                disabled={
                  Number(chanceBalance?.displayValue).toFixed(2) == "0.0" ||
                  depositIsLoading ||
                  exchangeBetBalance?.displayValue <=
                    chanceBalance?.displayValue
                }
                onClick={depositToken}>
                {exchangeBetBalance?.displayValue <=
                chanceBalance?.displayValue ? (
                  <>No {exchangeBetBalance?.symbol} to swap to</>
                ) : (
                  <>
                    {chanceBalance?.displayValue == "0.0"
                      ? `you don't have ${chanceBalance?.symbol} to swap`
                      : `swap ${chanceBalance?.symbol} to ${betTokenBalance?.symbol}`}
                  </>
                )}
              </button>
              <br />
              <br />
              {/* withdraw chance by depositing betToken */}
              <label>swapping from bet to chance</label>
              <br />
              <input
                type="number"
                disabled={
                  Number(betTokenBalance?.displayValue).toFixed(2) == "0.00" ||
                  cashOutIsLoading ||
                  betTokenBalance?.displayValue <
                    exchangeChanceBalance?.displayValue
                }
                min={1}
                max={betTokenBalance?.displayValue}
                value={cashOutAmount}
                onChange={handleCashOut}
              />
              <br />
              <button
                disabled={
                  Number(betTokenBalance?.displayValue).toFixed(2) == "0.00" ||
                  cashOutIsLoading ||
                  betTokenBalance?.displayValue <
                  exchangeChanceBalance?.displayValue ||
                  exchangeChanceBalance?.displayValue < betTokenBalance?.displayValue
                }
                onClick={cashOutToken}>
                {betTokenBalance?.displayValue <
                exchangeChanceBalance?.displayValue ? (
                  <>Not enough {exchangeChanceBalance?.symbol} match your request</>
                ) : (
                  <>
                    {betTokenBalance?.displayValue == "0.0"
                      ? `you don't have ${betTokenBalance?.symbol} to swap`
                      : `swap ${betTokenBalance?.symbol} to ${chanceBalance?.symbol}`}
                  </>
                )}
              </button>
            </div>
            <hr></hr>
            <div>
              <p>exchange chance balance</p>
              {exchangeChanceBalance &&
                Number(exchangeChanceBalance?.displayValue).toFixed(2)}{" "}
              {""}
              {exchangeChanceBalance && exchangeChanceBalance?.symbol}
              <p>exchange betToken balance </p>
              {exchangeBetBalance &&
                Number(exchangeBetBalance?.displayValue).toFixed(2)}{" "}
              {""}
              {exchangeBetBalance && exchangeBetBalance?.symbol}
            </div>
          </div>
        ) : (
          <>Please Connect Your Wallet</>
        )}
      </main>
    </div>
  );
}