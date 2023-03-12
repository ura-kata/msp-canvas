import { useMemo } from "react";
import {
    AppContextData,
    PlutType,
    useAppContext,
    PultD3Data,
} from "../contexts/AppContext";

export function usePlutData(): PultD3Data[] {
    const { data, setData } = useAppContext();
    // { cx: 10, cy: 10, type: "violin" }

    return data.pluts;
}
