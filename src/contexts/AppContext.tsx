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

export type PlutType = "violin" | "viola" | "cello" | "bass";
export interface PultD3Data {
    cx: number;
    cy: number;
    type: PlutType;
    id: string;
}

export interface AppContextData {
    file?: File;
    fileUrl?: string;
    fileData?: FileData;
    pluts: PultD3Data[];
}

export function AppContextProvider(props: AppContextProviderProps) {
    const [data, setData] = useState<AppContextData>({
        pluts: [{ type: "viola", id: crypto.randomUUID(), cx: 200, cy: 200 }],
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
