import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './MintNFT.css';

const CHAIN_ID = 57073 ; // Chain ID for Base Sepolia
const RPC_URL = 'https://rpc-qnd.inkonchain.com'; // RPC URL for Base Sepolia
const CONTRACT_ADDRESS = "0xeFA54c6E545DD7afCD24Cac44d1876fAB98deE03"; // Replace with your actual contract address
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
        "name": "mint",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "mintPrice",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
];

function MintNFT() {
    const [mintPrice, setMintPrice] = useState("0");
    const [quantity, setQuantity] = useState(1);
    const [status, setStatus] = useState("Ready to Mint");
    const [totalSupply, setTotalSupply] = useState(0);
    const [maxSupply, setMaxSupply] = useState(3000);
    const [contract, setContract] = useState(null);
    const [isWalletConnected, setIsWalletConnected] = useState(false); // New state for wallet connection
 

    useEffect(() => {
        const init = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });

                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    if (parseInt(chainId, 16) !== CHAIN_ID) {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
                        });
                    }

                    const provider = new ethers.BrowserProvider(window.ethereum, CHAIN_ID);
                    const signer = await provider.getSigner();
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                    
                    const price = await contract.mintPrice();
                    setMintPrice(ethers.formatEther(price));
                    
                    // Fetch total minted directly
                    const totalMinted = await contract.totalSupply();
                    setTotalSupply(totalMinted.toString());
                    
                    setContract(contract);
                } catch (error) {
                    if (error.code === 4902) {
                        try {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId: `0x${CHAIN_ID.toString(16)}`,
                                        chainName: 'Ink',
                                        nativeCurrency: {
                                            name: 'Ether',
                                            symbol: 'ETH',
                                            decimals: 18
                                        },
                                        rpcUrls: [RPC_URL],
                                        blockExplorerUrls: ['https://explorer.inkonchain.com/']
                                    },
                                ],
                            });
                        } catch (addError) {
                            setStatus("Failed to add Base Sepolia network");
                            console.error(addError);
                        }
                    } else {
                        setStatus("User denied account access or network switch. Please try again.");
                        console.error(error);
                    }
                }
            } else {
                setStatus("Please install MetaMask!");
            }
        };
        init();
    }, []);

    const handleMint = async () => {
        if (contract) {
            try {
                setStatus("Minting...");
                const tx = await contract.mint(quantity, { value: ethers.parseEther((mintPrice * quantity).toString()) });
                await tx.wait();
                setStatus("Minting successful!");
                // Refresh total minted after minting
            
            } catch (error) {
                console.error("Minting error details:", {
                    reason: error.reason,
                    message: error.message,
                    data: error.data
                });
                setStatus(`Minting failed: ${error.reason || error.message}`);
            }
        }
    };

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                setIsWalletConnected(true);
                setStatus("Wallet connected");
                // Here you might want to fetch user's NFTs
              
            } catch (error) {
                setStatus("Failed to connect wallet");
                console.error(error);
            }
        } else {
            setStatus("Please install MetaMask!");
        }
    };


    return (
        <div className="mint-container">
            <div className="header">
                <img src='https://raw.seadn.io/files/6af1acf660826d34fe3853265ca3c546.svg' width={512} height={512} alt="Ink Tiny Cow" className="logo" />
                <h1>Onchain Ink Tiny Cows</h1>
            </div>
            {!isWalletConnected ? (
                <button onClick={connectWallet}>Connect Wallet</button>
            ) : (
                <>
                    <div className="info-section">
                        <p>Total Supply: {maxSupply}</p>
                        <p>Total Minted: {totalSupply} / {maxSupply}</p>
                        <p>Price - {mintPrice} ETH</p>
                        <p>Contract: {CONTRACT_ADDRESS}</p>
                        <p>Bridge to Ink: <a href="https://relay.link/bridge/ink?includeChainIds=57073&fromChainId=8453&fromCurrency=0x0000000000000000000000000000000000000000&toCurrency=0x0000000000000000000000000000000000000000" target="_blank" rel="noopener noreferrer">RelayLink</a></p>
                    </div>
                    <div className="mint-section">
                        <input 
                            type="number" 
                            value={quantity} 
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10))} 
                            min="1" max="100" 
                        />
                        <button onClick={handleMint}>Mint NFT</button>
                    </div>
                    <div className="nft-display">
                        <h2>Check your minted NFTs on blockchain explorer</h2>
            
                       
                    </div>
                </>
            )}
            <p className="status">{status}</p>
        </div>
    );
}

export default MintNFT;