import { FC } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "@/app/Layout";
import { Home, NoMatch } from "@/pages";
import { TypingImpulseProvider } from "@/pages/Home/context/TypingContext";

const App: FC = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={
              <TypingImpulseProvider>
                <Home />
              </TypingImpulseProvider>
            }
          />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
