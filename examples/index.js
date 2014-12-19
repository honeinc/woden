'use strict';

var ProxyCache = require( '../' ),
    proxycache = new ProxyCache( {
        output: process.stdout
    } ),
    DS = { };

proxycache.when( /mixpanel/, {
    getKey: function ( path, query ) {
        return path + ':' + JSON.stringify( query );
    },
    headers: {
        host: 'mixpanel.com'
    }
} );

proxycache.when( /www\.timeapi\.org\/utc\/now/, {
    caching: false 
} );

proxycache.when( /www\.timeapi\.org\/pdt\/in two hours/, {
    cacheTime: function( cacheEntry, req, proxyRes ) {
        if ( cacheEntry.body.length > 10000000 ) {
            return -1; // don't cache big responses
        }
        
        if ( req.url.match( /bar/) ) {
            return 0; // cache bar forever
        }
        
        if ( proxyRes.statusCode === 404 ) {
            return -1; // don't cache 404 responses
        }
        
        return 10000; // only cache for 10 seconds
    }  
} );

// don't crash on errors
proxycache.on( 'error', console.error.bind( console ) );

proxycache.store({
    get: function( key, callback ) {
        callback( null, DS[ key ] );
    },
    set: function( key, value, cacheTime, callback ) {
        DS[ key ] = value;
        if ( cacheTime > 0 ) {
            setTimeout( function() {
                delete DS[ key ];
            }, cacheTime );
        }
        callback();
    }
});

proxycache.listen( 9000 );