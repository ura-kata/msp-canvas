import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useAppContext } from "../contexts/AppContext";


interface InputDialogProps {
    open: boolean;
    onClose: () => void;
}
export function InputDialog(props: InputDialogProps) {
    const { data, setData } = useAppContext();
    const [pultText, setPultText] = useState(data.plutText ?? "");

    const handleSavePlut = () => {
        setData((d) => ({ ...d, plutText: pultText }));
        props.onClose();
    };

    const handleCalcelPult = () => {
        setPultText(data.plutText ?? "");
        props.onClose();
    };

    useEffect(() => {
        setPultText(data.plutText ?? "");
    }, [data.plutText]);

    return (
        <Dialog open={props.open} onClose={handleCalcelPult} fullWidth>
            <DialogTitle>プルト入力</DialogTitle>
            <DialogContent>
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
                <Button onClick={handleCalcelPult}>キャンセル</Button>
            </DialogActions>
        </Dialog>
    );
}
