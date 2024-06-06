import { FC } from "react";
import type { Logo as LogoProps } from "@/widgets/LayoutHeader/model/types";

const Logo: FC<LogoProps> = ({ logoName }) => {
  return (
    <div className="navbar-center">
      <a className="btn btn-ghost text-xl normal-case">{logoName}</a>
    </div>
  );
};

export default Logo;
