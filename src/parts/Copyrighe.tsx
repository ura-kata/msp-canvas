import { Typography } from "@mui/material";

export class CopyrightProps {
    className?: string;
    sideStyle?: boolean;
}

export function Copyright(props: CopyrightProps) {
    return (
        <div className={props.className}>
            {props.sideStyle ? (
                <>
                    <Typography color={"white"} fontSize={2} align="center">
                        MSP Canvas v{__APP_VERSION__} ©{" "}
                        {new Date().getFullYear()} uttne
                    </Typography>
                </>
            ) : (
                <>
                    <Typography color={"white"} variant="body2" align="center">
                        © {new Date().getFullYear()} uttne
                    </Typography>
                    <Typography color={"white"} variant="body2" align="center">
                        MSP Canvas v{__APP_VERSION__}
                    </Typography>
                </>
            )}
        </div>
    );
}
