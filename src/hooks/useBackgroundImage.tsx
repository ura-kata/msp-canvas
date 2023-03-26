import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../contexts/AppContext";

import baseCanvasUrl from "../assets/base-canvas.svg";
import { fileToEmbeddedUrl, urlToEmbeddedUrl } from "../libs/utils";

export interface BackgroundImageData {
    url: string;
    width: number;
    height: number;
    embeddedUrl: string;
}

export function useBackgroundImage(): BackgroundImageData | undefined {
    const { data, setData } = useAppContext();
    const [baseCanvasSize, setBaseCanvasSize] = useState<BackgroundImageData>();

    const [embeddedUrl, setEmbeddedUrl] = useState<string>();

    useEffect(() => {
        // base となる画像の初期化
        if (baseCanvasSize) {
            return;
        }

        const tmp = new Image();

        tmp.onload = () => {
            urlToEmbeddedUrl(baseCanvasUrl).then(embeddedUrl => {
                setBaseCanvasSize({
                    url: baseCanvasUrl,
                    width: tmp.naturalWidth,
                    height: tmp.naturalHeight,
                    embeddedUrl: embeddedUrl
                });    
            })
        };

        tmp.src = baseCanvasUrl;
    }, [baseCanvasSize]);

    useEffect(() => {
        const file = data.file;
        if (!file) return;

        const f = async () => {
            const url = await fileToEmbeddedUrl(file)
            setEmbeddedUrl(url);
        };

        f();
        
    }, [data]);

    const backgroundImageData = useMemo<BackgroundImageData | undefined>(() => {
        if (!data.fileUrl || !data.fileData || !embeddedUrl) {
            return baseCanvasSize;
        }
        return {
            url: data.fileUrl,
            width: data.fileData.width,
            height: data.fileData.height,
            embeddedUrl: embeddedUrl
        };
    }, [data, baseCanvasSize, embeddedUrl]);

    return backgroundImageData;
}
