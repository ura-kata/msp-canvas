import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
    Tooltip,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { MemberData, PartData, useAppContext } from "../contexts/AppContext";
import Grid2 from "@mui/material/Unstable_Grid2";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import "./InputMemberDialog.scss";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";

interface MemberRowProps {
    member: MemberData;
    parts: PartData[];
    onChange: (member: MemberData) => void;
    onDelete: (member: MemberData) => void;
}

function MemberRow(props: MemberRowProps) {
    const parts = useMemo(
        () => [{ id: "none", name: "-", color: "", size: 1 }, ...props.parts],
        [props.parts]
    );
    return (
        <>
            <Grid2 xs={1} md={1} className="input-member-grid-item">
                <IconButton onClick={() => props.onDelete(props.member)}>
                    <DeleteForeverIcon />
                </IconButton>
            </Grid2>
            <Grid2
                xs={11}
                md={4}
                className="input-member-grid-item"
                paddingRight={1}
            >
                <TextField
                    label="氏名"
                    value={props.member.name}
                    onChange={(e) => {
                        // 氏名を入力したときに自動で表示名を設定するロジックを入れておく
                        const prevName = props.member.name;
                        const value = e.target.value;
                        const display = props.member.display ?? "";

                        const prevNameDisplay =
                            prevName.split(/\s/).filter((v) => v !== "")[0] ??
                            "";
                        const valueDisplay =
                            value.split(/\s/).filter((v) => v !== "")[0] ?? "";
                        const newDisplay =
                            prevNameDisplay === display
                                ? valueDisplay
                                : display;

                        props.onChange({
                            ...props.member,
                            name: e.target.value,
                            display: newDisplay,
                        });
                    }}
                />
            </Grid2>
            <Grid2
                xs={6}
                md={4}
                className="input-member-grid-item"
                paddingRight={1}
            >
                <TextField
                    label="表示"
                    value={props.member.display}
                    onChange={(e) =>
                        props.onChange({
                            ...props.member,
                            display: e.target.value,
                        })
                    }
                />
            </Grid2>
            <Grid2 xs={6} md={3} className="input-member-grid-item">
                <TextField
                    label="パート"
                    select
                    style={{ width: "100%" }}
                    value={props.member.partId ?? "none"}
                    onChange={(e) => {
                        props.onChange({
                            ...props.member,
                            partId:
                                e.target.value === "none"
                                    ? null
                                    : e.target.value,
                        });
                    }}
                >
                    {parts.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                            {p.name}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid2>
        </>
    );
}

interface InputMemberDialogProps {
    open: boolean;
    onClose: () => void;
}
export function InputMemberDialog(props: InputMemberDialogProps) {
    const { data, setData } = useAppContext();
    const [members, setMembers] = useState<MemberData[]>(data.members);

    const handleAccept = () => {
        setData({ ...data, members: [...members] });
        props.onClose();
    };

    const handleCalcel = () => {
        setMembers(data.members ? [...data.members] : []);
        props.onClose();
    };

    useEffect(() => {
        setMembers(data.members ? [...data.members] : []);
    }, [data.members]);

    const handleAddMember = () => {
        setMembers((_members) => {
            const lastPartId = _members[-1]?.id;
            const newMembers = [
                ..._members,
                {
                    id: crypto.randomUUID(),
                    name: "",
                    display: "",
                    partId: lastPartId ?? null,
                },
            ];
            return newMembers;
        });
    };

    const handlePaste = async () => {
        const items = await navigator.clipboard.read();

        if (items.length === 0) return;

        const parts = data.parts;

        const partDict: { [partName: string]: PartData } = {};
        parts.forEach((p) => {
            partDict[p.name?.trim() ?? ""] = p;
        });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.types.includes("text/plain")) {
                const blob = await item.getType("text/plain");

                const text = await blob.text();

                // 以下のようなデータ
                // 氏名\t表示\tパート名

                const pasteMembers = text
                    .replaceAll("\r", "")
                    .split("\n")
                    .filter((line) => line !== "")
                    .map((line) => {
                        const items = line.split("\t").map((v) => v.trim());

                        const name = items[0]?.trim() || undefined;
                        const display = (
                            items[1]?.trim() ||
                            name?.split(/\s/).filter((v) => v !== "")[0] ||
                            undefined
                        )?.trim();
                        const partName = items[2]?.trim();
                        const partId =
                            partName !== undefined
                                ? partDict[partName]?.id || null
                                : undefined;
                        return {
                            name: name,
                            display: display,
                            partId: partId,
                        };
                    });

                setMembers((prev) => {
                    const newMembers = pasteMembers.map((v, i) => {
                        return {
                            id: prev[i]?.id ? prev[i].id : crypto.randomUUID(),
                            name:
                                (v.name !== undefined
                                    ? v.name
                                    : prev[i]?.name) || "",
                            display:
                                (v.display !== undefined
                                    ? v.display
                                    : prev[i]?.display) || "",
                            partId:
                                (v.partId !== undefined
                                    ? v.partId
                                    : prev[i]?.partId) || null,
                        };
                    });
                    return newMembers;
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
    }, [props.open, data]);

    const handleCopyClipboard = () => {
        const parts = data.parts;

        const partDict: { [partName: string]: PartData } = {};
        parts.forEach((p) => {
            partDict[p.id?.trim() ?? ""] = p;
        });

        const lines = members.map((m) => {
            return `${m.name ?? ""}\t${m.display ?? ""}\t${
                partDict[m.partId ?? ""]?.name ?? ""
            }`;
        });
        const cd = lines.join("\n");
        navigator.clipboard.writeText(cd);
        alert("クリップボードにコピーしました!");
    };

    return (
        <Dialog open={props.open} onClose={handleCalcel} fullWidth>
            <DialogTitle>メンバーの入力</DialogTitle>
            <DialogContent>
                <Grid2 container rowSpacing={2} marginTop={1}>
                    {members.map((m) => {
                        return (
                            <MemberRow
                                key={m.id}
                                member={m}
                                parts={data.parts}
                                onChange={(member) => {
                                    setMembers((_members) => {
                                        const newMembers: MemberData[] = [];
                                        _members.forEach((_m) => {
                                            if (_m.id === member.id) {
                                                newMembers.push(member);
                                            } else {
                                                newMembers.push(_m);
                                            }
                                        });
                                        return newMembers;
                                    });
                                }}
                                onDelete={(member) => {
                                    setMembers((_members) => {
                                        const newMembers: MemberData[] = [];
                                        _members.forEach((_m) => {
                                            if (_m.id === member.id) return;
                                            newMembers.push(_m);
                                        });
                                        return newMembers;
                                    });
                                }}
                            />
                        );
                    })}
                    <Grid2 xs={12} md={12} className="input-member-grid-item">
                        <IconButton onClick={handleAddMember}>
                            <AddCircleIcon />
                        </IconButton>
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions>
                <IconButton onClick={handleCopyClipboard}>
                    <Tooltip title="クリップボードにコピー" arrow>
                        <ContentCopyIcon />
                    </Tooltip>
                </IconButton>
                <IconButton onClick={handlePaste}>
                    <Tooltip title="クリップボードから貼り付け" arrow>
                        <ContentPasteIcon />
                    </Tooltip>
                </IconButton>
                <IconButton onClick={handleAccept}>
                    <Tooltip title="適用" arrow>
                        <DoneIcon />
                    </Tooltip>
                </IconButton>
                <IconButton onClick={handleCalcel}>
                    <Tooltip title="キャンセル" arrow>
                        <CloseIcon />
                    </Tooltip>
                </IconButton>
            </DialogActions>
        </Dialog>
    );
}
