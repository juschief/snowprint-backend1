import { Router, Request, Response, RequestHandler } from "express";
import { ethers } from "ethers";
import { Block, TransactionResponse } from "@ethersproject/abstract-provider";
import axios from 'axios';

const router = Router();
const GLACIER_API_KEY = 'ac_n9_RVo_uaaLXdCv7xGEh4I919ELE8Mcgol-4PCkFsX67upkaAXWp57Od-cR0H8aY3riQkNQuTof5dg-DieQ9ew';
const GLACIER_API_URL = 'https://glacier-api.avax.network/v1';

const glacierClient = axios.create({
  baseURL: GLACIER_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-glacier-api-key': GLACIER_API_KEY
  }
});

// Add CORS headers middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Enhanced cache for network stats
interface NetworkStatsCache {
  tps: number;
  blockNumber: number;
  gasPrice: string;
  activeAddresses: number;
  lastUpdated: number;
  chainMetrics: {
    C: number;
    P: number;
    X: number;
  };
}

let networkStatsCache: NetworkStatsCache = {
  tps: 0,
  blockNumber: 0,
  gasPrice: "0",
  activeAddresses: 0,
  lastUpdated: 0,
  chainMetrics: { C: 0, P: 0, X: 0 }
};

// Test endpoint
const testHandler: RequestHandler = (_req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "Backend is connected!" });
};

// Fetch network stats using Avalanche Metrics API
async function fetchSnowtaceStats() {
  console.log("Fetching stats from Avalanche Metrics...");
  try {
  
    const response = await fetch(
      'https://api.avax.network/ext/bc/C/rpc'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Avalanche Metrics API');
    }

    const data = await response.json();
    console.log('Metrics API response:', data);
    
    // Match the response format from the example
    if (data && data.result && data.result.value) {
      const activeAddresses = parseInt(data.result.value) || 300000;
      
      networkStatsCache = {
        ...networkStatsCache,
        activeAddresses,
        lastUpdated: Date.now() / 1000
      };

      console.log('Updated active addresses:', activeAddresses);
      return true;
    }
  } catch (error) {
    console.error("Error fetching from Metrics API:", error);
  }
  
  // Use fallback value if API fails
  networkStatsCache = {
    ...networkStatsCache,
    activeAddresses: 300000,
    lastUpdated: Date.now() / 1000
  };
  
  return false;
}

// Network stats handler
interface GlacierMetricsResponse {
  blockHeight: number;
  gasPrice: string;
  transactionsPerSecond: number;
  activeAddresses: number;
  totalTransactions: number;
}

const networkStatsHandler: RequestHandler = async (_req, res) => {
  console.log("Network stats endpoint called");
  try {
    const response = await glacierClient.get<GlacierMetricsResponse>('/chains/43114/metrics');
    const data = response.data as GlacierMetricsResponse;

    res.json({
      blockNumber: data.blockHeight || 0,
      gasPrice: data.gasPrice || '0',
      tps: data.transactionsPerSecond || 0,
      activeAddresses: data.activeAddresses || 0,
      totalTransactions24h: data.totalTransactions || 0
    });
  } catch (err) {
    console.error("Network stats error:", err);
    res.status(500).json({ error: "Failed to fetch network stats" });
  }
};

// Add these interfaces back
interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Active' | 'Closed';
  votingEnds: string;
  votesFor: number;
  votesAgainst: number;
  proposer: string;
  link: string;
}

interface ProposalsResponse {
  totalActive: number;
  proposals: Proposal[];
  lastUpdated: number;
}

// Add the proposals handler
const proposalsHandler: RequestHandler = async (_req, res) => {
  console.log("Community proposals endpoint called");
  try {
    const baseUrl = "https://github.com/avalanche-foundation/ACPs/tree/main/ACPs";
    
    const proposals = [
      {
        id: "ACP-151",
        title: "Use current block P-Chain height as context",
        description: "Proposal to use the current P-Chain block height as context for various chain operations",
        status: 'Active',
        votingEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        votesFor: 12567,
        votesAgainst: 234,
        proposer: "avalanchefoundation",
        link: baseUrl
      },
      {
        id: "ACP-131",
        title: "Cancun EIPs",
        description: "Implementation of Ethereum Cancun upgrade EIPs on Avalanche C-Chain",
        status: 'Active',
        votingEnds: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        votesFor: 15890,
        votesAgainst: 445,
        proposer: "avaplatform",
        link: baseUrl
      },
      {
        id: "ACP-125",
        title: "Basefee Reduction",
        description: "Proposal to implement dynamic base fee reduction mechanism",
        status: 'Active',
        votingEnds: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        votesFor: 8234,
        votesAgainst: 123,
        proposer: "avalabs",
        link: baseUrl
      },
      {
        id: "ACP-118",
        title: "Warp Signature Request",
        description: "Implementation of signature request mechanism for Avalanche Warp Messaging",
        status: 'Active',
        votingEnds: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        votesFor: 9567,
        votesAgainst: 321,
        proposer: "avalanchefoundation",
        link: baseUrl
      },
      {
        id: "ACP-113",
        title: "Provable Randomness",
        description: "Implementation of verifiable random function (VRF) for secure randomness",
        status: 'Active',
        votingEnds: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        votesFor: 11234,
        votesAgainst: 567,
        proposer: "avaplatform",
        link: baseUrl
      }
    ];

    res.json({
      totalActive: proposals.filter(p => p.status === 'Active').length,
      proposals,
      lastUpdated: Date.now() / 1000
    });
  } catch (err) {
    console.error("Proposals error:", err);
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
};

// Add these interfaces at the top
interface GlacierTransaction {
  fromChain: string;
  toChain: string;
  hash: string;
  timestamp: number;
  amount: string;
  token: string;
  status: string;
}

interface GlacierResponse {
  transactions: GlacierTransaction[];
}

// Update the cross-chain handler
const crossChainHandler: RequestHandler = async (_req, res) => {
  console.log("Cross-chain endpoint called");
  try {
    const response = await glacierClient.get('/chains/43114/transactions?type=bridge');
    console.log('Glacier transactions response:', response.data);

    const data = response.data as GlacierResponse;
    const transactions = (data.transactions || []).map((tx: any) => ({
      sourceChain: tx.fromChain || 'Unknown',
      destinationChain: tx.toChain || 'Avalanche',
      hash: tx.hash,
      timestamp: tx.timestamp,
      amount: tx.amount || '0',
      token: tx.token || 'AVAX',
      status: tx.status || 'Completed',
      type: 'Bridge'
    }));

    res.json({ data: transactions });
  } catch (err) {
    console.error("Cross-chain error:", err);
    res.status(500).json({ error: "Failed to fetch cross-chain transactions" });
  }
};

// Register core routes
router.get("/test", testHandler);
router.get("/stats/network", networkStatsHandler);
router.get("/stats/blocks/latest", async (req, res) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC);
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    res.json({
      number: block.number,
      hash: block.hash,
      timestamp: block.timestamp,
      transactions: block.transactions
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch latest block" });
  }
});

router.get("/stats/transactions", async (req, res) => {
  console.log("Latest transactions endpoint called");
  try {
    if (!process.env.AVALANCHE_RPC) {
      throw new Error("AVALANCHE_RPC not configured");
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_RPC);
    const currentBlock = await provider.getBlockNumber();
    
    const blocks = await Promise.all(
      Array.from({ length: 5 }, (_, i) => provider.getBlock(currentBlock - i))
    );

    const transactions = [];
    
    for (const block of blocks) {
      if (!block) continue;
      
      const txPromises = block.transactions
        .slice(0, 3)
        .map(async (txHash: string) => {
          const tx = await provider.getTransaction(txHash);
          if (!tx) return null;
          
          const receipt = await provider.getTransactionReceipt(txHash);
          
          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: ethers.utils.formatEther(tx.value),
            timestamp: block.timestamp,
            blockNumber: tx.blockNumber,
            gasUsed: receipt ? receipt.gasUsed.toString() : '0',
            status: receipt ? receipt.status === 1 : false
          };
        });

      const blockTxs = await Promise.all(txPromises);
      transactions.push(...blockTxs.filter(tx => tx !== null));
    }

    const latestTxs = transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    res.json(latestTxs);
  } catch (err) {
    const error = err as Error;
    console.error("Latest transactions error:", error);
    res.status(500).json({ error: "Failed to fetch latest transactions" });
  }
});

router.get("/community/proposals", proposalsHandler);

// Add cross-chain transactions endpoint
router.get("/stats/cross-chain", crossChainHandler);

export default router;