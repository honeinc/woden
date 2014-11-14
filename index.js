var http = require( 'http' ),
    httpProxy = require( 'http-proxy' );

//
// Create a proxy server with custom application logic
//
var proxy = httpProxy.createProxyServer({});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
var server = http.createServer( function( req, res ) {

    //
    // check if req is in cache respond in mem cache is probably good        
    //

    proxy.web( req, res, { 
        target: process.env.MIXPANEL_URL // mixpanel 
    } );
} );

proxy.on( 'proxyRes', function( proxyRes, req, res ) {
    
    //
    // cache call
    // 

} );

console.log( 'listening on port 5050' );
server.listen(5050);