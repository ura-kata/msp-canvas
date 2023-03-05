import { useMemo } from "react";

export interface PultData {
    cx: number;
    cy: number;
    type: "violin" | "viola" | "violoncello" | "contrabass" | "grand-piano";
}

export function usePlutData(): PultData[] {
    const data = useMemo(() => {
        return [
            {
                cx: 10,
                cy: 10,
                type: "violin",
            },
        ] as PultData[];
    }, []);

    return data;
}
