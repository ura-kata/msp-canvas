
/** Blob を base64 に変換する */
export function fileToBase64(file: Blob): Promise<{base64:string, mimeType:string}> {
    return new Promise<{base64:string, mimeType:string}>((resolve,reject)=>{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = ()=>{
            const result = reader.result;
            if(typeof result === "string"){
                const mimeType = getMimeType(result);
                const base64 = result.split(',')[1];
                resolve({
                    base64: base64,
                    mimeType: mimeType
                });
            }else{
                reject(new Error("Invalid file type"));
            }
        };
        reader.onerror = ()=>{
            reject (reader.error);
        };
    });
}

//** Fail をbase64で組み込み可能なURLに変換する */
export function fileToEmbeddedUrl(file: Blob): Promise<string> {
    return new Promise<string>((resolve,reject)=>{
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = ()=>{
            const result = reader.result;
            if(typeof result === "string"){
                resolve(result);
            }else{
                reject(new Error("Invalid file type"));
            }
        };
        reader.onerror = ()=>{
            reject (reader.error);
        };
    });
}

//** URL をbase64で組み込み可能なURLに変換する */
export function urlToEmbeddedUrl(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fetch(url).then(r =>r.blob()).then(file=>{
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = ()=>{
                const result = reader.result;
                if(typeof result === "string"){
                    resolve(result);
                }else{
                    reject(new Error("Invalid file type"));
                }
            };
            reader.onerror = ()=>{
                reject (reader.error);
            };
        }).catch(e => { reject (e);})
        
    });
}

/** MimeType を FileReader の result から取得する
 */
export function getMimeType(fileReaderResult: string): string{
    const match = /^data:(.+?);/.exec(fileReaderResult);
    if(match){
        return match[1];
    }
    throw new Error("mime-type が存在しません");
}

/** base64 を File に変換 */
export function base64ToFile(base64: string, mimeType: string) : File{
    const filename = "export";

    const byteChars = atob(base64);
    const byteNums = new Array(byteChars.length);
    for(let i = 0;i < byteChars.length; i++){
        byteNums[i] = byteChars.charCodeAt(i);
    }
    const byteData = new Uint8Array(byteNums);
    const blob = new Blob([byteData], {type: mimeType});
    return new File([blob],filename, {type:mimeType});
}