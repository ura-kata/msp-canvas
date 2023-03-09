import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../contexts/AppContext";

import baseCanvasUrl from "../assets/base-canvas.svg";

export interface BackgroundImageData {
    url: string;
    width: number;
    height: number;
}

export function useBackgroundImage(): BackgroundImageData | undefined {
    const { data, setData } = useAppContext();
    const [baseCanvasSize, setBaseCanvasSize] = useState<BackgroundImageData>();

    useEffect(() => {
        if (baseCanvasSize) {
            return;
        }

        const tmp = new Image();

        tmp.onload = () => {
            setBaseCanvasSize({
                url: baseCanvasUrl,
                width: tmp.naturalWidth,
                height: tmp.naturalHeight,
            });
        };

        tmp.src = baseCanvasUrl;
    }, [baseCanvasSize]);

    const backgroundImageData = useMemo<BackgroundImageData | undefined>(() => {
        if (!data.fileUrl || !data.fileData) {
            return baseCanvasSize;
        }
        return {
            url: data.fileUrl,
            width: data.fileData.width,
            height: data.fileData.height,
        };
    }, [data, baseCanvasSize]);

    return backgroundImageData;
}
