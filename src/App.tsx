import "./App.scss";
import { BrowserRouter } from "react-router-dom";
import { Control } from "./parts/Control";
import { Content } from "./parts/Content";

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <div className="content">
                    <Content />
                </div>
                <div className="control">
                    <Control />
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
