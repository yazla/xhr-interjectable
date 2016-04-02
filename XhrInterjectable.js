
module.exports = ({
    realXhrConstructor,
    requestToKeyFn,
    cacheResponses = false,
    storage // {save, load}
}) => () => {

    var myXHR = new realXhrConstructor();
    var xhrWrapper = {
        set onreadystatechange(value){
            xhrWrapper._onreadystatechange = value;
            xhrWrapper.response &&
                xhrWrapper._onreadystatechange();
        },
        get onreadystatechange(){
            return xhrWrapper._onreadystatechange;
        },
        set onerror(value){ //for now just delegate onerror to the real xhr
            myXHR.onerror = value;
        },
        get onerror(){
            return myXHR.onerror;
        }
    };

    function onSuccessfullResponseRecieved (response) {
        xhrWrapper.readyState = 4;
        xhrWrapper.status = 200;
        xhrWrapper.response = xhrWrapper.responseText = response;
        xhrWrapper._onreadystatechange && xhrWrapper._onreadystatechange();
        xhrWrapper.onload && xhrWrapper.onload.apply(xhrWrapper)
    }

    function responseListener (){
        if (myXHR.readyState == 4 && myXHR.status == 200){
            if (cacheResponses){
                var key = requestToKeyFn(xhrWrapper.__url, xhrWrapper.method, post_data);
                storage.save(
                    key,
                    {
                        url : xhrWrapper.__url,
                        post : xhrWrapper.__post_data,
                        response : myXHR.response
                    }
                );
            }
            onSuccessfullResponseRecieved(myXHR.response);
        }
    };

    myXHR.addEventListener('readystatechange', responseListener);

    xhrWrapper.open = function (method, url, async, user, pass){
        xhrWrapper.__url = url;
        myXHR.open(method, url, async, user, pass);
    };

    xhrWrapper.send = function (post_data){
        xhrWrapper.response = xhrWrapper.responseText = null;
        xhrWrapper.__post_data = post_data;
        var key = requestToKeyFn(xhrWrapper.__url, xhrWrapper.method, post_data);
        var saved = storage.load(key)
        if (saved){
            if (typeof saved == 'function') {
                saved = saved(xhrWrapper);
            }
            onSuccessfullResponseRecieved(saved);
        } else {
            myXHR.send(post_data);
        }
    };

    xhrWrapper.setRequestHeader = function (DOMStringheader, DOMStringvalue){
        myXHR.setRequestHeader(DOMStringheader, DOMStringvalue);
    };

    xhrWrapper.getResponseHeader = function (DOMStringheader){
        myXHR.getResponseHeader(DOMStringheader);
    };
    xhrWrapper.getAllResponseHeaders = function (){
        myXHR.getAllResponseHeaders();
    };

    xhrWrapper.abort = function(){
        myXHR.abort();
    };

    xhrWrapper.withCredentials = false;

    return xhrWrapper;
};
