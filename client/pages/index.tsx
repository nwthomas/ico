import * as React from "react";
import styled from "styled-components";
import GlobalStyles from "../styles";
import WalletAddress from "../components/WalletAddress";
import { useEthereum } from "../hooks/useEthereum";
import { useFormik } from "formik";
import * as Yup from "yup";

const TWITTER_HANDLE = "nwthomas_";
const TWITTER_URL = `https://www.twitter.com/${TWITTER_HANDLE}`;

function App() {
  const {
    contributeEther,
    errorMessage,
    ethContributions,
    currentAccount,
    connectToWallet,
  } = useEthereum();

  const formik = useFormik({
    initialValues: {
      input: "",
    },
    validationSchema: Yup.object({
      input: Yup.number().required("Required").typeError("Must be a number"),
    }),
    onSubmit: (messageValues: { input: string }) => {
      contributeEther(messageValues.input);
    },
  });

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
        {currentAccount ? (
          <form onSubmit={formik.handleSubmit}>
            <p>How much ether do you want to contribute? (5 SPC / 1 ether)</p>
            <div>
              <p>{formik.errors.input}</p>
              <input
                name="input"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                placeholder="Ether amount"
                value={formik.values.input}
              />
            </div>
            <div>
              <button type="submit">Purchase Tokens</button>
            </div>
          </form>
        ) : null}
        {errorMessage ? <p>{errorMessage}</p> : null}
        {!currentAccount ? (
          <button onClick={connectToWallet}>Connect Wallet</button>
        ) : null}
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

  > form {
    p {
      margin-bottom: 10px;
    }

    > div {
      > p {
        color: red;
      }

      > input {
        margin-bottom: 10px;
        width: 100%;
      }
    }

    > div:last-of-type {
      display: flex;
      justify-content: center;
      width: 100%;

      > button {
        margin-bottom: 30px;
      }
    }
  }

  > p {
    color: red;
  }
`;

export default App;
