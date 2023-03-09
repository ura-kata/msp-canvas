import IconButton from "@mui/material/IconButton";
import "./Control.scss";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useState } from "react";
import Button from "@mui/material/Button";
import {
    AppContextData,
    PlutType,
    useAppContext,
} from "../contexts/AppContext";

export class NavProps {
    className?: string;
}

export function Control(props: NavProps) {
    const { data, setData } = useAppContext();
    const handlerUploadImage = () => {};
    const handlerInputImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const img = e.target.files[0];
        setData((d) => ({ ...d, file: img }));
    };

    const handleAdd = (type: PlutType) => {
        setData((d) => ({ ...d, pluts: [...d.pluts, { type: type }] }));
    };
    return (
        <div className={"nav-root " + props.className}>
            <Button variant="contained" component="label">
                背景画像をアップロード
                {/*
                materila ui の Button に input を仕込む方法
                https://stackoverflow.com/questions/40589302/how-to-enable-file-upload-on-reacts-material-ui-simple-input */}
                <input
                    hidden
                    id="img"
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={handlerInputImage}
                />
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => handleAdd("violin")}
            >
                Violin
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => handleAdd("viola")}
            >
                Viola
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => handleAdd("cello")}
            >
                Cello
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => handleAdd("bass")}
            >
                Bass
            </Button>
            <form></form>
        </div>
    );
}
