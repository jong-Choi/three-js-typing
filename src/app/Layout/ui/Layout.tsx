import { FC } from "react";
import { LayoutHeader } from "@/widgets";
import { Outlet } from "react-router-dom";

const Layout: FC = () => {
  return (
    <div className="h-screen overflow-x-hidden">
      <LayoutHeader />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
