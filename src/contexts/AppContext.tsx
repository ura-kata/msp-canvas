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
}

export interface AppContextData {
    file?: File;
    fileUrl?: string;
    fileData?: FileData;
    pults: PultD3Data[];
    plutData?: string;
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
        const pultData = data.plutData ?? "";

        const lines = pultData.split(/\r\n|\n/);

        const prevPluts: { [name: string]: PultD3Data } = {};
        data.pults.forEach(p => {
            prevPluts[p.name] = p;
        });

        const nameCounts: { [name: string]: number } = {};
        const pults = lines.filter(l => 0 < l.length).map(l => {
            let name = l.trim();
            if (name in nameCounts) {
                nameCounts[name]++;
            }
            else {
                nameCounts[name] = 1;
            }

            const key = 1 === nameCounts[name] ? name : (name + " " + nameCounts[name])

            if (key in prevPluts) {
                return prevPluts[key];
            }
            else {
                return {
                    name: key,
                    cx: 200,
                    cy: 200,
                    id: crypto.randomUUID(),
                    display: key[0]
                } as PultD3Data;
            }
        });

        setData(d => ({ ...d, pults: pults }));
    }, [data.plutData]);


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
