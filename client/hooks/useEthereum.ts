import * as React from "react";
import { ethers } from "ethers";
import ico from "../constants/ico.json";
import { CONTRACT_ADDRESS } from "../constants";
const { BigNumber } = ethers;

// This is a shim to extend the Window object with the methods used in this component from
// MetaMask extension
declare global {
  interface Window {
    ethereum: any;
  }
}

const errorMessages = {
  ATTACK_BOSS: "There was an error attacking the boss",
  NO_METAMASK: "Please install MetaMask",
  NO_NFT_FETCHED: "Your NFTs could not be fetched",
  WALLET_CONNECT: "There was an error connecting your wallet",
};

export const useEthereum = () => {
  // Network connection and error variables
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Mining status variables
  const [isMining, setIsMining] = React.useState(false);
  const [isMiningError, setIsMiningError] = React.useState(false);
  const [isMiningSuccess, setIsMiningSuccess] = React.useState(false);

  // State variables
  const [currentAccount, setCurrentAccount] = React.useState<string | null>(
    null
  );
  const [allAccounts, setAllAccounts] = React.useState<string[]>([]);
  const [ethContributions, setEthContributions] = React.useState<number | null>(
    null
  );

  // Fetch all on-load data necessary for app
  React.useEffect(() => {
    const { ethereum } = window;

    if (!ethereum) {
      setErrorMessage(errorMessages.NO_METAMASK);
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const icoContract = new ethers.Contract(CONTRACT_ADDRESS, ico.abi, signer);

    const fetchTokenBalance = async () => {
      if (currentAccount) {
        try {
          const balance = await icoContract.addressToContributions(
            currentAccount
          );
          setEthContributions(parseFloat(ethers.utils.formatEther(balance)));
        } catch (error) {
          setErrorMessage("Error fetching token count");
        }
      }
    };

    fetchTokenBalance();
  }, [currentAccount, isMiningSuccess]);

  // Attempt to connect to the Ethereum network and wallet on load of app
  React.useEffect(() => {
    const checkIfWalletIsConnected = async () => {
      const { ethereum } = window;

      if (ethereum) {
        setIsConnected(true);
        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length > 0) {
          const firstAccount = accounts[0];
          setCurrentAccount(firstAccount);
          setAllAccounts(accounts);
        }
      } else {
        setErrorMessage(errorMessages.NO_METAMASK);
      }

      setIsInitialized(true);
    };

    checkIfWalletIsConnected();
  }, []);

  // Set a series of listeners for possible events on load of app
  React.useEffect(() => {
    // Set listener to handle account changes
    window.ethereum.on("accountsChanged", (accounts: string[]) => {
      setEthContributions(null);
      setCurrentAccount(accounts[0]);
      setErrorMessage(null);
      setIsMiningError(false);
      setIsMiningSuccess(false);
      setIsMining(false);
    });
  }, []);

  // Manually attempt connection to user's wallet
  const connectToWallet = React.useCallback(async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setErrorMessage(errorMessages.NO_METAMASK);
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      setErrorMessage(errorMessages.WALLET_CONNECT);
    }
  }, []);

  const contributeEther = React.useCallback((etherAmount: string) => {
    setIsMiningError(false);
    setIsMiningSuccess(false);
    setErrorMessage(null);

    const { ethereum } = window;
    if (!ethereum) {
      setErrorMessage(errorMessages.NO_METAMASK);
      return;
    }

    const buyTokens = async () => {
      try {
        setIsMining(true);
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const icoContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ico.abi,
          signer
        );
        await icoContract.buyTokens({
          value: ethers.utils.parseEther(etherAmount),
        });
        setIsMiningSuccess(true);
      } catch (error: any) {
        setIsMining(false);
        setIsMiningError(true);
        setErrorMessage(error?.error?.message);
      }
    };

    buyTokens();
  }, []);

  return {
    // Variables
    allAccounts,
    currentAccount,
    errorMessage,
    ethContributions,
    isConnected,
    isInitialized,
    isMining,
    isMiningError,
    isMiningSuccess,

    // Functions
    changeAccount: setCurrentAccount,
    connectToWallet,
    contributeEther,
  };
};
