

var RespAuthError = (cltSocket) => {
    //in case of authentication error, send error response in client socket
    let error = {
        "error": "AuthError",
        "message": "Authentication failed, wrong gateway",
        "statusCode": 401,
        "originalError": {
            "path": "/rest/*",
            "message": "Authentication failed, wrong gateway",
            "type": "AuthenticationError",
            "details": {
                "name": "GatewayError",
                "message": "wrong gateway"
            }
        }
    };
    let SError = JSON.stringify(error);

    cltSocket.write("HTTP/1.1 401 Unauthorized\r\n");
    cltSocket.write("Date: "+new Date().toDateString()+"\r\n");
    cltSocket.write("Content-");
    cltSocket.write("Language: en\r\n");
    cltSocket.write("Content-Type: application/json; charset=utf-8\r\n");
    cltSocket.write("Content-Length: "+SError.length+"\r\n");
    cltSocket.write("Connection: close\r\n");
    cltSocket.write("\r\n");

    cltSocket.write(SError);
    cltSocket.end();
};
var RespAuthCustomError = (cltSocket, _error) => {
    //in case of authentication error, send error response in client socket
    let error = {
        "error": "AuthError",
        "message": _error.message,
        "statusCode": 401,
        "originalError": {
            "path": "/rest/*",
            "message": _error.message,
            "type": "AuthenticationError",
            "details": _error.details
        }
    };

    let SError = JSON.stringify(error);

    cltSocket.write("HTTP/1.1 401 Unauthorized\r\n");
    cltSocket.write("Date: "+new Date().toDateString()+"\r\n");
    cltSocket.write("Content-");
    cltSocket.write("Language: en\r\n");
    cltSocket.write("Content-Type: application/json; charset=utf-8\r\n");
    cltSocket.write("Content-Length: "+SError.length+"\r\n");
    cltSocket.write("Connection: close\r\n");
    cltSocket.write("\r\n");

    cltSocket.write(SError);
    cltSocket.end();
};


var InternalError = (cltSocket) => {
    let error = {
        "error": "InternalServerError",
        "message": "Unknown server error",
        "statusCode": 500,
        "originalError": {
            "path": "/rest/*",
            "message": "Unknown server error",
            "type": "UnknownError"
        }
    };
    let SError = JSON.stringify(error);
    cltSocket.write("HTTP/1.1 500 Internal Server Error\r\n");
    cltSocket.write("Date: "+new Date().toDateString()+"\r\n");
    cltSocket.write("Content-");
    cltSocket.write("Language: en\r\n");
    cltSocket.write("Content-Type: application/json; charset=utf-8\r\n");
    cltSocket.write("Content-Length: "+SError.length+"\r\n");
    cltSocket.write("Connection: close\r\n");
    cltSocket.write("\r\n");

    cltSocket.write(SError);

    cltSocket.end();
};


var TimeoutError = (cltSocket) => {
    let error = {
        "error": "GatewayTimeoutError",
        "message": "Gateway Timed Out",
        "statusCode": 504,
        "originalError": {
            "path": "/rest/*",
            "message": "Gateway Timed Out",
            "type": "GatewayTimeoutError"
        }
    };
    let SError = JSON.stringify(error);
    cltSocket.write("HTTP/1.1 504 Gateway Timeout\r\n");
    cltSocket.write("Date: "+new Date().toDateString()+"\r\n");
    cltSocket.write("Content-");
    cltSocket.write("Language: en\r\n");
    cltSocket.write("Content-Type: application/json; charset=utf-8\r\n");
    cltSocket.write("Content-Length: "+SError.length+"\r\n");
    cltSocket.write("Connection: close\r\n");
    cltSocket.write("\r\n");

    cltSocket.write(SError);

    cltSocket.end();
}


module.exports = {
    RespAuthCustomError: RespAuthCustomError,
    RespAuthError: RespAuthError,
    InternalError: InternalError,
    TimeoutError: TimeoutError
};