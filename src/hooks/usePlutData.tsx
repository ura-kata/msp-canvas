import { useMemo } from "react";
import {
    AppContextData,
    PlutType,
    useAppContext,
} from "../contexts/AppContext";

export interface PultD3Data {
    cx: number;
    cy: number;
    type: PlutType;
    id: string;
}

export function usePlutData(): PultD3Data[] {
    const { data, setData } = useAppContext();
    // { cx: 10, cy: 10, type: "violin" }
    const pluts = useMemo<PultD3Data[]>(() => {
        return data.pluts.map((p, i) => ({
            cx: 200,
            cy: 200,
            type: p.type,
            id: crypto.randomUUID(),
        }));
    }, [data.pluts]);

    return pluts;
}
