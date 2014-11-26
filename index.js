
/*
    
    Proxy Cache
    ==================================================================
    proxy cache is a module that allows you to run a proxy server that 
    will cache request.

    ```javascript
    var proxyCache = require( 'proxy-cache' );

    // rules for specific urls V regex to test url
    proxyCache.when( /mixpanel.com\/api/, { // when first is hit break loop
        getKey: function( url, query ) { } // gets fired on both request and
        ... // object to allow for more settings to be set in future
    } );

    // adapter for storing the cache
    proxyCache.store( { // the store adapter
        get: function( key, callback ) { },
        set: function( key, value, callback ) { }
    } );

    // basic event emitters
    proxyCache.on( 'request' , Function );
    proxyCache.on( 'response' , Function );
    proxyCache.on( 'cached' , Function );

    // listent to a port
    proxyCache.listen( PORT );
    ```
*/

var http = require( 'http' ),
    qs = require( 'querystring' ),
    util = require( 'util' ),
    EventEmitter = require( 'events' ).EventEmitter,
    httpProxy = require( 'http-proxy' );

module.exports = ProxyCache;

function ProxyCache( options ) {
    this.options = options || {};
    this.settings = [];
    this.proxy = httpProxy.createProxyServer( options );
    this.server = http.createServer( this._onRequest.bind( this ) );
    this.proxy.on( 'proxyRes', this._onResponse.bind( this ) );
    this.storageAdapter = require( './src/store' );
}   

util.inherits( ProxyCache, EventEmitter );

ProxyCache.prototype.when = function( regexp, settings ) {
    this.settings.push( [ regexp, settings ] );
};

ProxyCache.prototype.store = function( adapter ) {
    // maybe do som testing before setting adapter
    this.storageAdapter = adapter;
};

ProxyCache.prototype.listen = function( port ) {
    var port = port || 5050;
    if ( this.options.output ) {
        this.options.output.write( 'listening on port ' + port ); // assumes its a writable stream
    }
    this.server.listen( port );
};

ProxyCache.prototype._onRequest = function( req, res ) {

    this.emit( 'request', req );

    var payload = '',
        arg = req.url.split( '?' ),
        path = arg.shift( ),
        query = qs.parse( arg.pop( ) ),
        url = query.$url,
        settings = this._getSettings( url ),
        key = settings.getKey( path, query ),
        self = this;

    delete query.$url;

    req.on( 'data', function( data ) {
        payload += data.toString( data );
    });


    this.storageAdapter.get( key, function( err, cache ) {

        if ( cache && !err ) {
            cache.headers.CACHE = 'HIT';
            res.writeHead( cache.statusCode, cache.headers );
            res.write( cache.body );
            res.end( );
            res.cache = true;
            self.emit( 'reponse', res );
            return;
        }

        self.proxy.web( req, res, { 
            target: url 
        } );

    } );

};

ProxyCache.prototype._onResponse = function( proxyRes, req, res ) {
    
    this.emit( 'response', proxyRes );

    var payload = '',
        arg = req.url.split( '?' ),
        path = arg.shift( ),
        query = qs.parse( arg.pop( ) ),
        headers = proxyRes.headers,
        url = query.$url,
        settings = this._getSettings( url ),
        key = settings.getKey( path, query ),
        self = this,
        arr = [];

    function cached( cache ) {
        return function ( err ) {
            self.emit( err, cache );
            if ( !err && settings.onCache ) {
                settings.onCache( cache );
            }
        };
    }

    proxyRes.on( 'data', function( data ) {
        arr.push( data );
    } );

    proxyRes.on( 'end', function() {
        var cache = {
            headers: headers,
            statusCode: proxyRes.statusCode,
            body: Buffer.concat( arr )
        };
        
        self.storageAdapter.set( key, cache, cached( cache ) );
    } );
};

ProxyCache.prototype._getSettings = function( url ) {
    var settings;
    for( var i = 0; i < this.settings.length; i += 1 ) {
        settings = this.settings[ i ];
        if ( Array.isArray( settings ) && settings[ 0 ].test( url ) && settings[ 1 ] ) {
            return settings[ 1 ];
        }
    } 
    return {
        getKey: getKey
    }
};

function getKey( path, payload ) {
    return path + ':' + qs.stringify( payload );
}