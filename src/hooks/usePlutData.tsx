import { useMemo } from "react";

export interface PultD3Data {
    cx: number;
    cy: number;
    type: "violin" | "viola" | "violoncello" | "contrabass" | "grand-piano";
}

export function usePlutData(): PultD3Data[] {
    const data = useMemo(() => {
        return [
            {
                cx: 10,
                cy: 10,
                type: "violin",
            },
        ] as PultD3Data[];
    }, []);

    return data;
}
