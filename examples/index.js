var ProxyCache = require( '../' ),
    proxycache = new ProxyCache( {
        output: process.stdout,
        hostRewrite: true
    } ),
    DS = { };

proxycache.on( 'request', function() {
    console.log( 'request' );
} );

proxycache.on( 'response', function() {
    console.log( 'response' );
} );

proxycache.on( 'cached', function() {
    console.log( 'cached' );
} );

proxycache.when( /localhost:8000/, {
    getKey: function ( path, query ) {
        console.log( 'get key' );
        return 'dude';
    }
} );

proxycache.store({
    get: function( key, callback ) {
        console.log( 'get data', key );
        callback( null, DS[ key ] );
    },
    set: function( key, value, callback ) {
        console.log( 'set data', key );
        DS[ key ] = value;
        callback();
    }
});

proxycache.listen( 9000 );