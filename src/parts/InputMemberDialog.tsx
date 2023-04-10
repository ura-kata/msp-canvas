import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    MenuItem,
    TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { MemberData, PartData, useAppContext } from "../contexts/AppContext";
import Grid2 from "@mui/material/Unstable_Grid2";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import "./InputMemberDialog.scss";

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
            <Grid2 sm={1} className="input-member-grid-item">
                <IconButton onClick={() => props.onDelete(props.member)}>
                    <DeleteForeverIcon />
                </IconButton>
            </Grid2>
            <Grid2 sm={4} className="input-member-grid-item" paddingRight={1}>
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
            <Grid2 sm={4} className="input-member-grid-item" paddingRight={1}>
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
            <Grid2 sm={3} className="input-member-grid-item">
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

    const handleSavePlut = () => {
        setData({ ...data, members: [...members] });
        props.onClose();
    };

    const handleCalcelPult = () => {
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

    return (
        <Dialog open={props.open} onClose={handleCalcelPult} fullWidth>
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
                    <Grid2 sm={12} className="input-member-grid-item">
                        <IconButton onClick={handleAddMember}>
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
