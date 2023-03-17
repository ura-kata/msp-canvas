import { createContext, useContext, useState, useEffect } from "react";

export const AppContext = createContext(
    {} as {
        data: AppContextData;
        setData: React.Dispatch<React.SetStateAction<AppContextData>>;
    }
);

export class AppContextProviderProps {
    children: React.ReactNode;
}

export class FileData {
    width: number = 0;
    height: number = 0;
}

export interface PultD3Data {
    name: string;
    cx: number;
    cy: number;
    id: string;
    display: string;
    lineNo: number;
}

export interface AppContextData {
    file?: File;
    fileUrl?: string;
    fileData?: FileData;
    pults: PultD3Data[];
    plutText?: string;
}

export function AppContextProvider(props: AppContextProviderProps) {
    const [data, setData] = useState<AppContextData>({
        pults: [],
    });

    useEffect(() => {
        const fileUrl = data.fileUrl;
        if (fileUrl) {
            window.URL.revokeObjectURL(fileUrl);
        }

        const file = data.file;
        let url: string | undefined = undefined;
        if (file) {
            url = window.URL.createObjectURL(file);
        }

        if (url) {
            const u = url;
            const tmp = new Image();
            tmp.onload = () => {
                const fileData = {
                    width: tmp.naturalWidth,
                    height: tmp.naturalHeight,
                };
                setData((d) => ({
                    ...d,
                    fileData: fileData,
                }));
            };
            tmp.src = u;
        }

        setData((d) => ({ ...d, fileUrl: url, fileData: undefined }));

        console.log("created url");
    }, [data.file]);

    useEffect(() => {
        const pultData = data.plutText ?? "";

        const lines = pultData.split(/\r\n|\n/);

        const prevPluts: { [lineNo: number]: PultD3Data } = {};
        data.pults.forEach((p) => {
            prevPluts[p.lineNo] = p;
        });

        const pults = lines
            .map((l, i) => {
                let name = l.trim();

                if (name.length === 0) {
                    // 文字列がなければオブジェクトを作らない
                    return undefined;
                }

                if (i in prevPluts) {
                    const t = prevPluts[i];
                    t.name = name;
                    t.display = name.slice(0,2)
                    return t;
                } else {
                    return {
                        name: name,
                        cx: 200,
                        cy: 200,
                        id: crypto.randomUUID(),
                        display: name.slice(0,2),
                        lineNo: i,
                    } as PultD3Data;
                }
            })
            .filter((p): p is PultD3Data => p !== undefined);

        setData((d) => ({ ...d, pults: pults }));
    }, [data.plutText]);

    useEffect(() => {
        // DEBUG
        const pultData = "aaaa";
        setData((d) => ({ ...d, plutText: pultData }));
    }, []);

    return (
        <AppContext.Provider value={{ data, setData }}>
            {props.children}
        </AppContext.Provider>
    );
}

export function useAppContext(): {
    data: AppContextData;
    setData: React.Dispatch<React.SetStateAction<AppContextData>>;
} {
    return useContext(AppContext);
}
