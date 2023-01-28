import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./Content.scss";

export class ContentProps {}

export function Content(props: ContentProps) {
    const contentRootRef = useRef<HTMLDivElement>(null);
    const svg = useRef(
        null as d3.Selection<SVGSVGElement, unknown, HTMLElement, any> | null
    );

    useEffect(() => {
        const div = contentRootRef.current as HTMLDivElement;

        if (!svg.current) {
            const width = div.clientWidth;
            const height = div.clientHeight;
            const s = d3
                .select(".content-root")
                .append("svg")
                .attr("width", width)
                .attr("height", height);
            svg.current = s;
        }
        const resizeObserver = new ResizeObserver((e) => {
            const s = svg.current;
            if (!s) return;
            s.attr("width", div.clientWidth).attr("height", div.clientHeight);
        });

        resizeObserver.observe(div);

        return () => {
            resizeObserver.unobserve(div);
        };
    }, []);

    useEffect(() => {
        // TODO d3 の描画処理など
    }, [svg.current]);
    return <div className="content-root" ref={contentRootRef}></div>;
}
