'use strict';

/*
    
    Proxy Cache
    ==================================================================
    proxy cache is a module that allows you to run a proxy server that 
    will cache request.

*/

var http = require( 'http' ),
    qs = require( 'querystring' ),
    util = require( 'util' ),
    extend = require( 'node.extend' ),
    EventEmitter = require( 'events' ).EventEmitter,
    httpProxy = require( 'http-proxy' ),
    sortObject = require( 'sorted-object' ),
    sha1 = require( 'sha1' ),
    urlParse = require( 'url' ).parse,
    pkg = require( './package.json' );

module.exports = Woden;

/*
    Woden::Constructor 
    
    params
        options { Object } - set some base configuration, also gets passed to `http-proxy`

    returns
        instance

*/

function Woden( options ) {
    this.options = options || {};
    this.settings = [];
    this.proxy = httpProxy.createProxyServer( options );
    this.server = http.createServer( this._onRequest.bind( this ) );
    this.proxy.on( 'proxyRes', this.emit.bind( this, 'response' ) );
    this.proxy.on( 'proxyRes', this._cacheResponse.bind( this ) ); // optionally caches response
    this.proxy.on( 'proxyReq', this._onProxyReq.bind( this ) );
    this.storageAdapter = require( './src/store' );
    this.proxy.on( 'error', this._onError.bind( this ) );
}   

// inherit Event Emitter
util.inherits( Woden, EventEmitter );


/*
    Woden::when - allows for custom settings `when` url proxy is requested

    params 
        regexp { RegExp } - pattern to match against the request param $url
        settings { Object } - an object with some common settings
*/

Woden.prototype.when = function( regexp, settings ) {
    this.settings.push( [ regexp, settings ] );
};

/*
    Woden::store - Allows a custom storageAdapter

    params
        adapter { Object } - an object that has the methods `get` and `set`

*/

Woden.prototype.store = function( adapter ) {
    // maybe do som testing before setting adapter
    this.storageAdapter = adapter;
};

/*
    Woden::listen - Allows a custom port

    params
        port { Number } - port to listen proxy server on 

*/

Woden.prototype.listen = function( port, ipaddress ) {
    port = port || 5050;
    if ( this.options.output ) {
        this.options.output.write( 'listening on port ' + port ); // assumes its a writable stream
    }
    this.server.listen( port, ipaddress );
};

/*
    Woden::_onRequest - Private handler of incoming request

    params
        req { Request } - node request object
        res { Response } - node response object 

*/

Woden.prototype._onRequest = function( req, res ) {

    this.emit( 'request', req );

    var payload = '',
        arg = req.url.split( '?' ),
        path = arg.shift( ),
        query = qs.parse( arg.pop( ) ),
        target = query.$url || '',
        key,
        self = this;

    delete query.$url;
    req.url = ( path !== '/' ? path : '' ) + ( Object.keys( query ).length ? ( '?' + qs.stringify( query ) ) : '' );
    req._target = target;
    
    var settings = this._getSettings( req._target + req.url );
    req._settings = settings;

    query = sortObject( query ); 
    key = settings.getKey( req._target + req.url, query );

    if ( req.method.toLowerCase() === 'options' ) {
        if ( self.options.onOptions ) {
            self.options.onOptions( req, res );
            return;
        }
    }
    
    // right now only get request are supported
    if ( req.method.toLowerCase() !== 'get' ) {
        res.writeHead( 501 );
        res.write( 'Methods that are not "GET" are not implemented in proxy cache' );
        res.end( );
        res.cache = true;
        self.emit( 'reponse', res ); 
        return;
    }

    // test for a proper url
    if ( !/^(http|https):\/\//.test( req._target ) ) {
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
            // add header to signify a cache hit
            cache.headers[ 'cache-agent' ] = pkg.name;
            res.writeHead( cache.statusCode, cache.headers );
            res.write( cache.body );
            res.end( );
            res.cache = true;
            self.emit( 'reponse', res );
            return;
        }

        self.proxy.web( req, res, { 
            target: req._target,
            toProxy: req.url.length ? false : true
        } );
    } );

};

/*
    Woden::_cacheResponse - Private caching handler

    params
        proxyRes { Response } - node response object from proxy 
        req { Request } - node request object
        res { Response } - node response object 

*/

Woden.prototype._cacheResponse = function( proxyRes, req ) {

    if ( !req._settings.caching ) {
        return;
    }
    
    var arg = req.url.split( '?' ),
        query = sortObject( qs.parse( arg.pop( ) ) ),
        headers = proxyRes.headers,
        settings = req._settings,
        key = settings.getKey( req._target + req.url, query ),
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

        var timeout = settings.cacheTimeout( cache, req, proxyRes );
        if ( timeout < 0 ) {
            return;
        }
        
        self.storageAdapter.set( {
            key: key,
            value: cache,
            timeout: timeout
        }, cached( cache ) );
    } );
};

/*
    Woden::_getSettings - Private utility to grab the current url's setting

    params
        url { String } - url that proxy is going to be requesting 

*/

Woden.prototype._getSettings = function( url ) {
    var settings;
    for( var i = 0; i < this.settings.length; ++i ) {
        var curSettings = this.settings[ i ];
        if ( Array.isArray( curSettings ) && curSettings[ 0 ].test( url ) && curSettings[ 1 ] ) {
            settings = curSettings[ 1 ];
        }
    } 
    return extend( true, {}, {
        getKey: getKey,
        caching: true,
        cacheTimeout: function() {
            return 3600000; // default to an hour
        }
    }, settings );
};

/*
    Woden::_onProxyReq - Private handler of request pre proxy

    params
        proxyRes { Request } - node request object for proxy 
        req { Request } - node request object

*/

Woden.prototype._onProxyReq = function( proxyReq, req ) {
    var headers = req._settings.headers || {};

    for ( var key in headers ) {
        proxyReq.setHeader( key, headers[ key ] );
    }
    
    if ( !headers.host ) {
        var parsed = urlParse( req._target, false, true );
        proxyReq.setHeader( 'host', parsed.host );
    }
};

/*
    Woden::_onError - Private handler of errors

    params
        error { Error } - error object ( not a string ) 

*/

Woden.prototype._onError = function( error ) {
    this.emit( 'error', error );
};

/*
    getKey - Utility for default key

    params
        url { String } - the full target url of the request
        payload { Object } - query object from initial request 

*/

function getKey( url, payload ) {
    return sha1( url + ':' + qs.stringify( payload ) );
}
