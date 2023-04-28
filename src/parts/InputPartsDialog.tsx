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
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";

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
            <Grid2 xs={1} md={1} className="input-part-grid-item">
                <IconButton onClick={() => props.onDelete(props.part)}>
                    <DeleteForeverIcon />
                </IconButton>
            </Grid2>
            <Grid2 xs={11} md={5} className="input-part-grid-item">
                <TextField
                    label="パート名"
                    value={props.part.name}
                    onChange={(e) =>
                        props.onChange({ ...props.part, name: e.target.value })
                    }
                />
            </Grid2>
            <Grid2 xs={8} md={3} className="input-part-grid-item">
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
            <Grid2 xs={4} md={3} className="input-part-grid-item">
                <ColorSelector
                    color={props.part.color}
                    onChange={(color) =>
                        props.onChange({ ...props.part, color: color })
                    }
                ></ColorSelector>
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

    const handlePaste = async () => {
        const items = await navigator.clipboard.read();

        if (items.length === 0) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.types.includes("text/plain")) {
                const blob = await item.getType("text/plain");

                const text = await blob.text();

                // 以下のようなデータ
                // パート名\tサイズ

                const pasteParts = text
                    .replaceAll("\r", "")
                    .split("\n")
                    .filter((line) => line !== "")
                    .map((line) => {
                        const items = line.split("\t").map((v) => v.trim());

                        const name = items[0];
                        const size = parseFloat(items[1]);
                        return {
                            name: name,
                            size: isNaN(size) ? undefined : size,
                        };
                    });

                setParts((prev) => {
                    const newParts = pasteParts.map((v, i) => {
                        return {
                            id: prev[i]?.id ? prev[i].id : crypto.randomUUID(),
                            name:
                                (v.name !== undefined
                                    ? v.name
                                    : prev[i]?.name) || "",
                            color: prev[i]?.color || "#000",
                            size:
                                (v.size !== undefined
                                    ? v.size
                                    : prev[i]?.size) || 1,
                        };
                    });
                    return newParts;
                });
            }
        }
    };

    useEffect(() => {
        if (!props.open) return;

        const hendleKeyDown = async (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "v") {
                await handlePaste();
            }
        };

        window.addEventListener("keydown", hendleKeyDown);
        return () => window.removeEventListener("keydown", hendleKeyDown);
    }, [props.open]);

    const handleCopyClipboard = () => {
        const lines = parts.map((m) => {
            return `${m.name ?? ""}\t${m.size ?? ""}`;
        });
        const cd = lines.join("\n");
        navigator.clipboard.writeText(cd);
        alert("クリップボードにコピーしました!");
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
                    <Grid2 xs={12} md={12} className="input-part-grid-item">
                        <IconButton onClick={handleAddPart}>
                            <AddCircleIcon />
                        </IconButton>
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions>
                <IconButton onClick={handleCopyClipboard}>
                    <ContentPasteIcon />
                </IconButton>
                <IconButton onClick={handlePaste}>
                    <ContentPasteGoIcon />
                </IconButton>
                <IconButton onClick={handleSavePlut}>
                    <DoneIcon />
                </IconButton>
                <IconButton onClick={handleCalcelPult}>
                    <CloseIcon />
                </IconButton>
            </DialogActions>
        </Dialog>
    );
}
