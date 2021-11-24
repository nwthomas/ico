import * as React from "react";
import styled from "styled-components";
import GlobalStyles from "../styles";
import WalletAddress from "../components/WalletAddress";
import { useEthereum } from "../hooks/useEthereum";

const TWITTER_HANDLE = "nwthomas_";
const TWITTER_URL = `https://www.twitter.com/${TWITTER_HANDLE}`;

function App() {
  const { ethContributions, currentAccount, connectToWallet } = useEthereum();

  let buttonLabel = "Connect Wallet";
  if (currentAccount) {
    buttonLabel = "Purchase Tokens";
  }

  return (
    <>
      <GlobalStyles />
      <RootStyles className="App">
        <WalletAddress
          currentAccount={currentAccount ? currentAccount : undefined}
        />
        <h1>Space Coin ICO</h1>
        {typeof ethContributions === "number" ? (
          <h2>{`Contributions: ${ethContributions} ether (${
            ethContributions * 5
          } tokens)`}</h2>
        ) : null}
        <button onClick={connectToWallet}>{buttonLabel}</button>
        <a href={TWITTER_URL}>{`Built by ${TWITTER_HANDLE}`}</a>
      </RootStyles>
    </>
  );
}

const RootStyles = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: 100px;
  position: relative;
  width: 100%;

  > a {
    color: #161616;
    bottom: 0;
    margin-bottom: 50px;
    position: absolute;
  }
`;

export default App;
