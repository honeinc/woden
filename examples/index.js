var ProxyCache = require( '../' ),
    proxycache = new ProxyCache( {
        output: process.stdout
    } ),
    DS = { };

proxycache.when( /mixpanel/, {
    getKey: function ( path, query ) {
        return path + ':' + JSON.stringify( query );
    },
    headers : {
        host: 'mixpanel.com'
    }
} );

proxycache.store({
    get: function( key, callback ) {
        callback( null, DS[ key ] );
    },
    set: function( key, value, callback ) {
        DS[ key ] = value;
        callback();
    }
});

proxycache.listen( 9000 );