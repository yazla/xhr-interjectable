interface XhrInterjectableConfig {
    realXhrConstructor : Function
    requestToKeyFn : (url : string, method: string, data : any) => string
    storage : {
        save : (key : string, data : {status, response, headers}) => void,
        load : (key : string) => {status, response, headers}
    }
}

declare module 'xhr-interjectable' {
    let constructor : (config : XhrInterjectableConfig) => XMLHttpRequest;
    export default constructor;
}
