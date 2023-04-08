import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { base64ToFile } from "../libs/utils";

export interface AppContextInterface {
    data: AppContextData;
    setData: React.Dispatch<React.SetStateAction<AppContextData>>;
    loadExportData: (exData: ExportDataV1) => void;
}

export const AppContext = createContext({} as AppContextInterface);

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
    color?: string;
}

export interface PartData {
    id: string;
    name: string;
    color: string;
    size: number;
}

export interface ExportDataV1 {
    version: "1";
    pultText: string;
    pults: PultD3Data[];
    backgroundImage: string;
    backgroundImageMimeType: string;
}

export interface AppContextData {
    file?: File;
    fileUrl?: string;
    fileData?: FileData;
    pults: PultD3Data[];
    parts: PartData[];
    plutText?: string;
    /** pixel/m */
    scale: number;
}

export function AppContextProvider(props: AppContextProviderProps) {
    const [data, setData] = useState<AppContextData>({
        pults: [],
        parts: [],
        scale: 400,
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

        const getColor = (line: string): { color?: string; other: string } => {
            const match = /#color:(.+?)( |$)/.exec(line);
            if (match) {
                const other =
                    line.slice(0, match.index) +
                    line.slice(match.index + match[0].length);
                return { color: match[1], other: other };
            }
            return { other: line };
        };

        const pults = lines
            .map((l, i) => {
                let line = l.trim();

                if (line.length === 0) {
                    // 文字列がなければオブジェクトを作らない
                    return undefined;
                }

                const { other, color } = getColor(line);
                const name = other.trim();

                if (i in prevPluts) {
                    const t = prevPluts[i];
                    t.name = name;
                    t.display = name.slice(0, 2);
                    t.color = color;
                    return t;
                } else {
                    return {
                        name: name,
                        cx: 200,
                        cy: 200,
                        id: crypto.randomUUID(),
                        display: name.slice(0, 2),
                        lineNo: i,
                        color: color,
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

    const loadExportData = useCallback(
        (exData: ExportDataV1) => {
            const backgroundImage = base64ToFile(
                exData.backgroundImage,
                exData.backgroundImageMimeType
            );

            setData((d) => ({
                ...d,
                plutText: exData.pultText,
                pults: exData.pults,
                file: backgroundImage,
            }));
        },
        [data]
    );

    return (
        <AppContext.Provider value={{ data, setData, loadExportData }}>
            {props.children}
        </AppContext.Provider>
    );
}

export function useAppContext(): AppContextInterface {
    return useContext(AppContext);
}
