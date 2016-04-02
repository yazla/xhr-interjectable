interface XhrInterjectableConfig {
    realXhrConstructor : Function
    requestToKeyFn : (url : string, method: string, data : any) => string
    storage : {
        save : (key : string, data : any) => void,
        load : (key : string) => any
    }
}

declare module 'xhr-interjectable' {
    let constructor : (config : XhrInterjectableConfig) => XMLHttpRequest;
    export default constructor;
}
