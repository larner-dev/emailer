# http-response-helpers

In this module:

- Error classes for each 4xx and 5xx http status code.
- An HTTP redirect class that can be returned to inform your router to redirect somewhere
- Type guard helper classes to determine if an unknown variable is an HTTP error or HTTP redirect.

## Usage

```
function route() {
    throw new HTTPError.BadRequest('INVALID_EMAIL', { email: '@bademail' });
}

try {
    const result = route();
    if(isHTTPRedirect(result)) {
        // redirect to result.location with status result.status
    }
    else {
        // do something else
    }
}
catch(error) {
    if(isHTTPError(error)) {
        console.log('got an http error');
    }
}
```

### Helper Classes

```
isHTTPError(maybeHTTPError: unknown, code?: HTTPErrorCode): : maybeHTTPError is HTTPError
```

Returns true if `maybeHTTPError` is a valid HTTPError and provides a type guard to that effect.

- **maybeHTTPError**: any variable that you want to confirm is a HTTPError or not.
- **code**: optional HTTPErrorCode (4xx or 5xx). If this parameter is specified then the function will only return true if `maybeHTTPError` is an HTTPError and matches the specified `code`.

```
isHTTPRedirect(maybeHTTPRedirect: unknown, status?: HTTPRedirect): : maybeHTTPRedirect is HTTPRedirect
```

Returns true if `maybeHTTPRedirect` is a valid HTTPRedirect and provides a type guard to that effect.

- **maybeHTTPRedirect**: any variable that you want to confirm is a HTTPRedirect or not.
- **status**: optional number (3xx). If this parameter is specified then the function will only return true if `maybeHTTPRedirect` is an HTTPRedirect with a status that matches the specified `status`.

### HTTPRedirect

```
new HTTPRedirect(location: string, status: number = 302);
```

The HTTPRedirect object is a special object you can return from your routes that notifies the server to redirect to a specific location with the specified redirect status code.

- **location**: a string that specifies where you should be redirected to.
- **status**: optional number (default 302). If this parameter is specified then the function will only return true if `maybeHTTPRedirect` is an HTTPRedirect with a status that matches the specified `status`.

### HTTPError

```
new HTTPError.BadRequest(message: string, params: Jsonifiable = null)
```

The HTTPError object is a special object you can return from your routes that notifies the server which type of error should be returned fro the route.

- **message**: a string that specifies which message (in addition to the error code) should be returned with the error.
- **params**: optional JSON object. This is a way to pass additional information back with the error apart from the error code and message.

#### Supported classes

- HTTPError.BadRequest
- HTTPError.Unauthorized
- HTTPError.PaymentRequired
- HTTPError.Forbidden
- HTTPError.NotFound
- HTTPError.MethodNotAllowed
- HTTPError.NotAcceptable
- HTTPError.ProxyAuthenticationRequired
- HTTPError.RequestTimeout
- HTTPError.Conflict
- HTTPError.Gone
- HTTPError.LengthRequired
- HTTPError.PreconditionFailed
- HTTPError.PayloadTooLarge
- HTTPError.URITooLong
- HTTPError.UnsupportedMediaType
- HTTPError.RangeNotSatisfiable
- HTTPError.ExpectationFailed
- HTTPError.MisdirectedRequest
- HTTPError.UnprocessableEntity
- HTTPError.Locked
- HTTPError.FailedDependency
- HTTPError.TooEarly
- HTTPError.UpgradeRequired
- HTTPError.PreconditionRequired
- HTTPError.TooManyRequests
- HTTPError.RequestHeaderFieldsTooLarge
- HTTPError.UnavailableForLegalReasons
- HTTPError.InternalServerError
- HTTPError.NotImplemented
- HTTPError.BadGateway
- HTTPError.ServiceUnavailable
- HTTPError.GatewayTimeout
- HTTPError.HTTPVersionNotSupported
- HTTPError.VariantAlsoNegotiates
- HTTPError.InsufficientStorage
- HTTPError.LoopDetected
- HTTPError.NotExtended
- HTTPError.NetworkAuthenticationRequired
