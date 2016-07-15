
module.exports = ({
    realXhrConstructor,
    requestToKeyFn,
    storage // {save, load}
}) => function() {

    var myXHR = new realXhrConstructor();
    var xhrWrapper = {
        set onreadystatechange(value){
            xhrWrapper._onreadystatechange = value;
            value && xhrWrapper.response && xhrWrapper._onreadystatechange();
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

    function onSuccessfullResponseRecieved ({status, response, headers, }) {
        xhrWrapper.readyState = 4;
        xhrWrapper.status = status;
        xhrWrapper.response = response;
        xhrWrapper.responseText = JSON.stringify(response);
        xhrWrapper.responseHeaders = headers;
        xhrWrapper._onreadystatechange && xhrWrapper._onreadystatechange();
        xhrWrapper.onload && xhrWrapper.onload.apply(xhrWrapper)
    }

    function responseListener (){
        if (myXHR.readyState == 4 && myXHR.status == 200){
            var key = requestToKeyFn(xhrWrapper.__url, xhrWrapper.method, xhrWrapper.__post_data);
            var saveObj = {
                    url : xhrWrapper.__url,
                    post : xhrWrapper.__post_data,
                    response : myXHR.response,
                    headers : toJson(myXHR.getAllResponseHeaders()),
                    status : myXHR.status
                };
            storage.save(
                key,
                saveObj
            );

            onSuccessfullResponseRecieved(saveObj);
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
        return this.responseHeaders && this.responseHeaders[DOMStringheader];
    };
    xhrWrapper.getAllResponseHeaders = function (){
        var headersStr = '';
        for (var prop in this.responseHeaders) {
            var val = this.responseHeaders[prop];
            headersStr += `${prop}: ${val}\r\n`
        }
        return headersStr;
    };

    xhrWrapper.abort = function(){
        myXHR.abort();
    };

    xhrWrapper.withCredentials = false;

    return xhrWrapper;
};


function toJson(text='')
{
    return text.split('\r\n').reduce(
        function (prev, current){
            var parts = current.split(':');
            prev[parts[0]] = parts[1];
            return prev;
        },
        {}
    )
};