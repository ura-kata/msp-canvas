import {
    Button,
    ButtonBase,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { PartData, useAppContext } from "../contexts/AppContext";
import { HexColorPicker } from "react-colorful";
import Grid2 from "@mui/material/Unstable_Grid2/Grid2";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import "./InputPartsDialog.scss";

interface ColorSelectorPops {
    color: string;
    onChange: (color: string) => void;
}

function ColorSelector(props: ColorSelectorPops) {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectColor, setSelectColor] = useState(props.color);
    const handleOnClick = () => {
        setSelectColor(props.color);
        setOpenDialog(true);
    };

    const handleOnCancel = () => {
        setOpenDialog(false);
    };
    const handleOnOk = () => {
        setOpenDialog(false);
        props.onChange(selectColor);
    };
    const handleColorChange = (color: string) => {
        console.log(color);
        setSelectColor(color);
    };
    return (
        <>
            <ButtonBase onClick={handleOnClick}>
                <Paper
                    style={{
                        width: 30,
                        height: 30,
                        backgroundColor: props.color,
                    }}
                    variant="outlined"
                ></Paper>
            </ButtonBase>
            <Dialog open={openDialog} onClose={handleOnCancel}>
                <DialogContent>
                    <HexColorPicker
                        style={{ marginTop: 20 }}
                        color={selectColor}
                        onChange={handleColorChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleOnOk}>決定</Button>
                    <Button onClick={handleOnCancel}>キャンセル</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

interface PartRowProps {
    part: PartData;
    onChange: (part: PartData) => void;
    onDelete: (part: PartData) => void;
}

function PartRow(props: PartRowProps) {
    return (
        <>
            <Grid2 sm={1} className="input-part-grid-item">
                <IconButton onClick={() => props.onDelete(props.part)}>
                    <DeleteForeverIcon />
                </IconButton>
            </Grid2>
            <Grid2 sm={5} className="input-part-grid-item">
                <TextField
                    label="パート名"
                    value={props.part.name}
                    onChange={(e) =>
                        props.onChange({ ...props.part, name: e.target.value })
                    }
                />
            </Grid2>
            <Grid2 sm={3} className="input-part-grid-item">
                <ColorSelector
                    color={props.part.color}
                    onChange={(color) =>
                        props.onChange({ ...props.part, color: color })
                    }
                ></ColorSelector>
            </Grid2>
            <Grid2 sm={3} className="input-part-grid-item">
                <TextField
                    label="サイズ[m]"
                    type="number"
                    inputProps={{
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                    }}
                    value={props.part.size}
                    onChange={(e) =>
                        props.onChange({
                            ...props.part,
                            size: parseFloat(e.target.value ?? "0"),
                        })
                    }
                />
            </Grid2>
        </>
    );
}

interface InputPartsDialogProps {
    open: boolean;
    onClose: () => void;
}
export function InputPartsDialog(props: InputPartsDialogProps) {
    const { data, setData } = useAppContext();

    const [parts, setParts] = useState<PartData[]>([...data.parts]);

    const handleSavePlut = () => {
        setData((d) => ({ ...d, parts: [...parts] }));
        props.onClose();
    };

    const handleCalcelPult = () => {
        props.onClose();
        setParts([...data.parts]);
    };

    useEffect(() => {
        setParts([...data.parts]);
    }, [data.parts]);

    const handleAddPart = () => {
        setParts([
            ...parts,
            {
                id: crypto.randomUUID(),
                name: "バイオリン",
                color: "#000",
                size: 1,
            },
        ]);
    };

    return (
        <Dialog open={props.open} onClose={handleCalcelPult} fullWidth>
            <DialogTitle>パートの入力</DialogTitle>
            <DialogContent>
                <Grid2 container rowSpacing={2} marginTop={1}>
                    {parts.map((p, i) => {
                        return (
                            <PartRow
                                key={p.id}
                                part={p}
                                onChange={(part) => {
                                    setParts((_parts) => {
                                        const newParts: PartData[] = [];
                                        _parts.forEach((_p) => {
                                            if (_p.id === part.id) {
                                                newParts.push(part);
                                            } else {
                                                newParts.push(_p);
                                            }
                                        });
                                        return newParts;
                                    });
                                }}
                                onDelete={(part) => {
                                    setParts((_parts) => {
                                        const newParts: PartData[] = [];
                                        _parts.forEach((_p) => {
                                            if (_p.id === part.id) return;
                                            newParts.push(_p);
                                        });
                                        return newParts;
                                    });
                                }}
                            />
                        );
                    })}
                    <Grid2 sm={12} className="input-part-grid-item">
                        <IconButton onClick={handleAddPart}>
                            <AddCircleIcon />
                        </IconButton>
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleSavePlut}>保存</Button>
                <Button onClick={handleCalcelPult}>キャンセル</Button>
            </DialogActions>
        </Dialog>
    );
}
