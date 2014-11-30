var test = require( 'tape' ),
    ProxyCache = require( '../' );

test( 'testing the constructor', function( t ) {
    var proxyCache = new ProxyCache( { foo: 'bar' } );
    t.equals( typeof proxyCache, 'object', 'new instance of proxyCache is returned');
    // testing api endpoints
    t.equals( typeof proxyCache.options, 'object', 'proxyCache.options is an object');
    t.equals( proxyCache.options.foo, 'bar', 'proxyCache.options contains properties passed into the options param');
    t.equals( typeof proxyCache.when, 'function', 'proxyCache.when is a function');
    t.equals( typeof proxyCache.store, 'function', 'proxyCache.store is a function');
    t.equals( typeof proxyCache.listen, 'function', 'proxyCache.listen is a function');
    t.equals( typeof proxyCache._onRequest, 'function', 'proxyCache._onRequest is a function');
    t.equals( typeof proxyCache._onResponse, 'function', 'proxyCache._onResponse is a function');
    t.equals( typeof proxyCache._getSettings, 'function', 'proxyCache._getSettings is a function');
    t.equals( typeof proxyCache._onProxyReq, 'function', 'proxyCache._onProxyReq is a function');
    t.equals( typeof proxyCache._onError, 'function', 'proxyCache._onError is a function');
    t.end();
});

test( 'testing proxyCache::when', function ( t ) {
    var proxyCache = new ProxyCache( { foo: 'bar' } );

    t.equals( Array.isArray( proxyCache.settings ), true, 'a setting is an array' );
    t.equals( proxyCache.settings.length, 0, 'a setting is an empty array' );

    proxyCache.when( /hello/, {} );

    t.equals( proxyCache.settings.length, 1, 'a setting is added to proxyCache.settings' );
    t.equals( proxyCache.settings[ 0 ][ 0 ] instanceof RegExp, true, 'first param is a Regular Expression' );
    t.equals( typeof proxyCache.settings[ 0 ][ 1 ], 'object', 'second param is an object' );
    t.end();
} );

test( 'testing proxyCache::store', function( t ) {
    var proxyCache = new ProxyCache( { foo: 'bar' } );

    t.equals( typeof proxyCache.storageAdapter, 'object', 'proxyCache.storageAdapter is a object' );
    t.equals( typeof proxyCache.store, 'function', 'proxyCache.store is a function' );

    proxyCache.store({ baz : 'qux' });
    t.equals( typeof proxyCache.storageAdapter, 'object', 'proxyCache.storageAdapter is a object' );
    t.equals( proxyCache.storageAdapter.baz, 'qux', 'proxyCache.storageAdapter now has the properties of the object passed in to store' );

    t.end();
});