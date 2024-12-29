"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ethers_1 = require("ethers");
const router = (0, express_1.Router)();
// Cache for network stats
let lastBlockNumber = 0;
let lastBlockTimestamp = 0;
let transactionCount = 0;
let activeAddressesSet = new Set();
// Test endpoint
router.get("/test", (req, res) => {
    console.log("Test endpoint called");
    res.json({ message: "Backend is connected!" });
});
// Network Stats endpoint
router.get("/stats/network", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Network stats endpoint called");
    try {
        if (!process.env.AVALANCHE_RPC) {
            console.error("AVALANCHE_RPC not configured");
            throw new Error("AVALANCHE_RPC not configured");
        }
        console.log("Connecting to RPC:", process.env.AVALANCHE_RPC);
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC);
        console.log("Fetching blockchain data...");
        const [blockNumber, gasPrice] = yield Promise.all([
            provider.getBlockNumber(),
            provider.getGasPrice()
        ]);
        // Get a block that's definitely finalized (100 blocks behind)
        const safeBlockNumber = blockNumber - 100;
        const block = yield provider.getBlock(safeBlockNumber);
        if (!block) {
            throw new Error("Failed to fetch block data");
        }
        // Calculate TPS
        if (lastBlockNumber !== blockNumber && block) {
            const timeDiff = block.timestamp - lastBlockTimestamp;
            if (timeDiff > 0) {
                // Get full block with transactions
                const fullBlock = yield provider.getBlock(safeBlockNumber);
                if (fullBlock) {
                    transactionCount = fullBlock.transactions.length;
                    lastBlockNumber = blockNumber;
                    lastBlockTimestamp = block.timestamp;
                    // Track active addresses from transaction hashes
                    for (const txHash of fullBlock.transactions) {
                        try {
                            const tx = yield provider.getTransaction(txHash);
                            if (tx) {
                                if (tx.from)
                                    activeAddressesSet.add(tx.from);
                                if (tx.to)
                                    activeAddressesSet.add(tx.to);
                            }
                        }
                        catch (err) {
                            console.warn("Failed to fetch transaction details:", err);
                            // Continue with the next transaction
                            continue;
                        }
                    }
                    // Keep only last 24 hours of addresses
                    const oneDayAgo = Date.now() / 1000 - 86400;
                    if (block.timestamp > oneDayAgo) {
                        activeAddressesSet.clear();
                    }
                }
            }
        }
        const tps = transactionCount;
        const activeAddresses = activeAddressesSet.size;
        console.log("Data fetched successfully:", {
            blockNumber,
            gasPrice: gasPrice.toString(),
            tps,
            activeAddresses
        });
        res.json({
            blockNumber,
            gasPrice: ethers_1.ethers.utils.formatUnits(gasPrice, "gwei"),
            tps,
            activeAddresses,
            totalTransactions24h: transactionCount * 5256 // Approximate blocks per day
        });
    }
    catch (err) {
        const error = err;
        console.error("Network stats error:", error);
        res.status(500).json({
            error: "Failed to fetch network stats",
            details: error.message || "Unknown error"
        });
    }
}));
// DApps endpoint
router.get("/dapps", (_req, res) => {
    console.log("DApps endpoint called");
    try {
        const mockDapps = [
            {
                id: "1",
                name: "Trader Joe",
                category: "DEX",
                description: "Leading DEX on Avalanche",
                url: "https://traderjoexyz.com",
                tvl: 100000000,
                volume24h: 5000000,
                users24h: 10000
            }
        ];
        res.json(mockDapps);
    }
    catch (err) {
        const error = err;
        console.error("DApps error:", error);
        res.status(500).json({ error: "Failed to fetch DApps" });
    }
});
// Bridge tokens endpoint
router.get("/bridge/tokens", (_req, res) => {
    console.log("Bridge tokens endpoint called");
    try {
        const mockTokens = [
            {
                address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
                symbol: "WAVAX",
                name: "Wrapped AVAX",
                decimals: 18,
                chainId: 43114,
                logoUrl: "/tokens/avax.png"
            }
        ];
        res.json(mockTokens);
    }
    catch (err) {
        const error = err;
        console.error("Bridge tokens error:", error);
        res.status(500).json({ error: "Failed to fetch bridge tokens" });
    }
});
// Blockchain Stats endpoints
router.get("/stats/blocks", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Latest blocks endpoint called");
    try {
        if (!process.env.AVALANCHE_RPC) {
            throw new Error("AVALANCHE_RPC not configured");
        }
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC);
        const currentBlock = yield provider.getBlockNumber();
        // Use finalized blocks (100 blocks behind)
        const safeBlockNumber = currentBlock - 100;
        // Fetch last 5 blocks
        const blockPromises = Array.from({ length: 5 }, (_, i) => provider.getBlock(safeBlockNumber - i));
        const blocks = yield Promise.all(blockPromises);
        const formattedBlocks = blocks
            .filter(block => block !== null)
            .map(block => ({
            number: block.number.toString(),
            timestamp: block.timestamp,
            transactions: block.transactions.length,
            hash: block.hash
        }));
        res.json(formattedBlocks);
    }
    catch (err) {
        const error = err;
        console.error("Latest blocks error:", error);
        res.status(500).json({ error: "Failed to fetch latest blocks" });
    }
}));
router.get("/stats/transactions", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Latest transactions endpoint called");
    try {
        if (!process.env.AVALANCHE_RPC) {
            throw new Error("AVALANCHE_RPC not configured");
        }
        const provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC);
        const currentBlock = yield provider.getBlockNumber();
        // Use finalized block (100 blocks behind)
        const safeBlockNumber = currentBlock - 100;
        const block = yield provider.getBlock(safeBlockNumber);
        if (!block) {
            throw new Error("Failed to fetch block");
        }
        // Get last 5 transaction hashes
        const txHashes = block.transactions.slice(0, 5);
        // Fetch full transaction details
        const txPromises = txHashes.map(hash => provider.getTransaction(hash));
        const txs = yield Promise.all(txPromises);
        // Format transactions
        const transactions = txs
            .filter(tx => tx !== null)
            .map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers_1.ethers.utils.formatEther(tx.value),
            timestamp: block.timestamp
        }));
        res.json(transactions);
    }
    catch (err) {
        const error = err;
        console.error("Latest transactions error:", error);
        res.status(500).json({ error: "Failed to fetch latest transactions" });
    }
}));
router.get("/stats/cross-chain", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Cross-chain transactions endpoint called");
    try {
        // For now, return mock data as cross-chain tracking requires additional infrastructure
        const mockCrossChainTxs = Array.from({ length: 5 }, () => ({
            sourceChain: Math.random() > 0.5 ? 'Ethereum' : 'BSC',
            destinationChain: 'Avalanche',
            hash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
            timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 3600)
        }));
        res.json(mockCrossChainTxs);
    }
    catch (err) {
        const error = err;
        console.error("Cross-chain transactions error:", error);
        res.status(500).json({ error: "Failed to fetch cross-chain transactions" });
    }
}));
exports.default = router;
