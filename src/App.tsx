import "./App.scss";
import { BrowserRouter } from "react-router-dom";
import { Control } from "./parts/Control";
import { Content } from "./parts/Content";
import { createContext } from "react";
import { AppContextProvider } from "./contexts/AppContext";

function App() {
    return (
        <BrowserRouter>
            <AppContextProvider>
                <div className="app">
                    <div className="content">
                        <Content />
                    </div>
                    <div className="control">
                        <Control />
                    </div>
                </div>
            </AppContextProvider>
        </BrowserRouter>
    );
}

export default App;
