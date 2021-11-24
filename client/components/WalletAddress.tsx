import * as React from "react";
import styled from "styled-components";

type Props = {
  currentAccount?: string;
};

const WalletAddress = ({ currentAccount }: Props) => {
  const renderCurrentAccount = () => {
    if (currentAccount) {
      const start = currentAccount.slice(0, 5);
      const end = currentAccount.slice(currentAccount.length - 6);
      return start + "...." + end;
    }
  };

  return (
    <RootStyles withCurrentAccount={!!currentAccount}>
      <p>{!!currentAccount ? "Connected" : "Not Connected"}</p>
      {currentAccount ? (
        <div>
          <p>{renderCurrentAccount()}</p>
        </div>
      ) : null}
    </RootStyles>
  );
};

type StyleProps = {
  withCurrentAccount: boolean;
};

const RootStyles = styled.div<StyleProps>`
  align-items: center;
  display: flex;
  margin-top: 20px;
  margin-right: 20px;
  position: absolute;
  top: 0;
  right: 0;
  > p {
    color: ${({ withCurrentAccount }) =>
      withCurrentAccount ? "green" : "red"};
    margin-right: 10px;
  }
  > div:nth-child(2) {
    align-items: center;
    display: flex;
    border-radius: 15px;
    background: #161616;
    display: flex;
    color: white;
    justify-content: center;
    padding: 6px 10px;
  }
`;

export default WalletAddress;
