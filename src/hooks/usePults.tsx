import { useEffect, useMemo } from "react";
import {
    AppContextData,
    PlutType,
    useAppContext,
    PultD3Data,
} from "../contexts/AppContext";

export function usePults(): PultD3Data[] {
    const { data, setData } = useAppContext();
    return data.pults;
}
