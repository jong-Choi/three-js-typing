import { FC } from "react";
import { Logo } from "@/widgets";

const LayoutHeader: FC = () => {
  return (
    <>
      <header>
        <nav className="flex justify-center bg-base-100">
          <Logo logoName={"3D Typing Practice"} />
        </nav>
      </header>
    </>
  );
};

export default LayoutHeader;
