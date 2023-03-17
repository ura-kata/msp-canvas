import "./Control.scss";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { useAppContext } from "../contexts/AppContext";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from "@mui/material";

export class NavProps {
    className?: string;
}

export function Control(props: NavProps) {
    const { data, setData } = useAppContext();
    const handlerInputImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const img = e.target.files[0];
        setData((d) => ({ ...d, file: img }));
    };

    const [dialogOpne, setDialogOpne] = useState(false);

    const [pultText, setPultText] = useState(data.plutText ?? "");

    const handleSavePlut = () => {
        setDialogOpne(false);
        setData((d) => ({ ...d, plutText: pultText }));
    };

    const handleCalcelPlut = () => {
        setDialogOpne(false);
        setPultText(data.plutText ?? "");
    };

    useEffect(() => {
        setPultText(data.plutText ?? "");
    }, [data.plutText]);

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
                    accept=".png,.jpg,.jpeg,.svg"
                    onChange={handlerInputImage}
                />
            </Button>
            <Button
                variant="contained"
                component="label"
                onClick={() => setDialogOpne(true)}
            >
                プルト入力
            </Button>
            <Dialog open={dialogOpne} onClose={handleCalcelPlut} fullWidth>
                <DialogTitle>プルト入力</DialogTitle>
                <DialogContent >
                    <TextField
                        fullWidth
                        multiline
                        rows={20}
                        value={pultText}
                        onChange={(e) => setPultText(e.target.value)}
                    ></TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleSavePlut}>保存</Button>
                    <Button onClick={handleCalcelPlut}>キャンセル</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
