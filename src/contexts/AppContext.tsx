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
    loadExportData: (exData: ExportDataV2) => void;
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
    size: number;
}

export interface PartData {
    id: string;
    name: string;
    color: string;
    size: number;
}

export interface MemberData {
    id: string;
    name: string;
    display: string;
    partId: string | null;
}

export interface ExportDataV1 {
    version: "1";
    pultText: string;
    pults: PultD3Data[];
    backgroundImage: string;
    backgroundImageMimeType: string;
}
export interface ExportDataV2 {
    version: "2";
    pults: PultD3Data[];
    backgroundImage: string;
    backgroundImageMimeType: string;
    parts: PartData[];
    members: MemberData[];
}

export interface AppContextData {
    file?: File;
    fileUrl?: string;
    fileData?: FileData;
    pults: PultD3Data[];
    parts: PartData[];
    members: MemberData[];
    plutText?: string;
    /** pixel/m */
    scale: number;
}

const DefaultParts: PartData[] = [
    {
        name: "Vn. 1",
        color: "#800000",
        id: "6817baa3-244e-456d-8a62-70e495fade0e",
        size: 0.5,
    },
    {
        name: "Vn. 2",
        color: "#ff8c00",
        id: "f69a5deb-0a2f-4e60-bbf6-99cced841071",
        size: 0.5,
    },
    {
        name: "Va.",
        color: "#2e8b57",
        id: "96d8374a-5769-4b74-b240-aa9b5f43a425",
        size: 0.5,
    },
    {
        name: "Vc.",
        color: "#4682b4",
        id: "8eb13cf6-d3b2-4e76-a0de-a4536ffa4c9f",
        size: 0.5,
    },
    {
        name: "Cb.",
        color: "#800080",
        id: "277c5317-ea27-4844-a851-091bf0e769a7",
        size: 0.5,
    },
    {
        name: "Cond.",
        color: "#000000",
        id: "85f3ecb8-451a-431f-a5e6-8ddb13701f27",
        size: 0.5,
    },
];

export function AppContextProvider(props: AppContextProviderProps) {
    const [data, setData] = useState<AppContextData>({
        pults: [],
        parts: DefaultParts,
        members: [],
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
        const members = data.members ?? [];
        const parts = data.parts ?? [];
        const partDict = parts.reduce((prev, curr) => {
            return { ...prev, [curr.id]: curr };
        }, {} as { [id: string]: PartData });

        const prevPluts: { [id: string]: PultD3Data } = {};
        data.pults.forEach((p) => {
            prevPluts[p.id] = p;
        });

        const pults = members
            .map((m) => {
                const id = m.id;
                const name = m.name;
                const display = m.display;
                const part = m.partId ? partDict[m.partId] : undefined;
                const color = part?.color ?? "#000";
                const size = part?.size === undefined ? 1 : part.size;

                if (id in prevPluts) {
                    const _m = prevPluts[id];
                    _m.name = name;
                    _m.display = display;
                    _m.color = color;
                    _m.size = size;
                    return _m;
                } else {
                    return {
                        name: name,
                        cx: 200,
                        cy: 200,
                        id: id,
                        display: display,
                        lineNo: 0,
                        color: color,
                        size: size,
                    } as PultD3Data;
                }
            })
            .filter((p): p is PultD3Data => p !== undefined);

        setData((d) => ({ ...d, pults: pults }));
    }, [data.parts, data.members]);

    useEffect(() => {
        // DEBUG
        const pultData = "aaaa";
        setData((d) => ({ ...d, plutText: pultData }));
    }, []);

    const loadExportData = useCallback(
        (exData: ExportDataV2) => {
            const backgroundImage = base64ToFile(
                exData.backgroundImage,
                exData.backgroundImageMimeType
            );

            setData((d) => ({
                ...d,
                parts: exData.parts ?? [],
                members: exData.members ?? [],
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
