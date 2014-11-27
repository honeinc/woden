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
    httpProxy = require( 'http-proxy' ),
    sortObject = require( 'sorted-object' ),
    sha1 = require( 'sha1' );

module.exports = ProxyCache;

function ProxyCache( options ) {
    this.options = options || {};
    this.settings = [];
    this.proxy = httpProxy.createProxyServer( options );
    this.server = http.createServer( this._onRequest.bind( this ) );
    this.proxy.on( 'proxyRes', this._onResponse.bind( this ) );
    this.proxy.on('proxyReq', this._onProxyReq.bind( this ) );
    this.storageAdapter = require( './src/store' );
    this.proxy.on( 'error', this._onError.bind( this ) );
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
        url = query.$url || '',
        settings = this._getSettings( url ),
        key,
        self = this;

    req._settings = settings;

    delete query.$url;
    req.url = path + '?' + qs.stringify( query );

    query = sortObject( query ); 
    key = settings.getKey( path, query );

    if ( req.method.toLowerCase() !== 'get' ) {
        res.writeHead( 501 );
        res.write( 'Methods that are not "GET" are not implemented in proxy cache' );
        res.end( );
        res.cache = true;
        self.emit( 'reponse', res ); 
        return;
    }

    if ( !/^(http|https):\/\//.test( url ) ) {
        res.writeHead( 400 );
        res.write( '$url query param requires a valid url to use proxy cache' );
        res.end( );
        res.cache = true;
        self.emit( 'reponse', res ); 
        return;
    }

    req.on( 'data', function( data ) {
        payload += data.toString( data );
    });

    this.storageAdapter.get( key, function( err, cache ) {

        if ( cache && !err ) {
            cache.headers[ 'cache-agent' ] = 'node-proxy-cache';
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
        query = sortObject( qs.parse( arg.pop( ) ) ),
        headers = proxyRes.headers,
        url = query.$url,
        settings = req._settings,
        key = settings.getKey( path, query ),
        self = this,
        arr = [];

    function cached( cache ) {
        return function ( err ) {
            if ( err ) {
                this._onError( err );
            }
            if ( !err && settings.onCache ) {
                self.emit( 'cached', cache );
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

ProxyCache.prototype._onProxyReq = function( proxyReq, req ) {
    var settings = req._settings,
        headers = req._settings.headers || {};

    for ( var key in headers ) {
        proxyReq.setHeader( key, headers[ key ] );
    }
};

ProxyCache.prototype._onError = function( error ) {
    if( this.listeners('error').length === 1) {
        throw error;
    }
    this.emit( 'error', error );
};



function getKey( path, payload ) {
    return sha1( path + ':' + qs.stringify( payload ) );
}