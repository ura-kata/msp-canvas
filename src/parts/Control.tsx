import IconButton from "@mui/material/IconButton";
import "./Control.scss";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useState } from "react";

export class NavProps {
    className?: string;
}

export function Control(props: NavProps) {
    return <div className={"nav-root " + props.className}></div>;
}
