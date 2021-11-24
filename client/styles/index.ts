import { createGlobalStyle } from "styled-components";
import GlobalStyle from "./globals";
import ResetStyle from "./reset";

const GlobalStyleWithReset = createGlobalStyle`
    ${ResetStyle}
    ${GlobalStyle}
`;

export default GlobalStyleWithReset;
