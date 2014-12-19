'use strict';

var test = require( 'tape' ),
    Woden = require( '../' );

test( 'testing the constructor', function( t ) {
    var woden = new Woden( { foo: 'bar' } );
    t.equals( typeof woden, 'object', 'new instance of woden is returned');
    // testing api endpoints
    t.equals( typeof woden.options, 'object', 'woden.options is an object');
    t.equals( woden.options.foo, 'bar', 'woden.options contains properties passed into the options param');
    t.equals( typeof woden.when, 'function', 'woden.when is a function');
    t.equals( typeof woden.store, 'function', 'woden.store is a function');
    t.equals( typeof woden.listen, 'function', 'woden.listen is a function');
    t.equals( typeof woden._onRequest, 'function', 'woden._onRequest is a function');
    t.equals( typeof woden._cacheResponse, 'function', 'woden._cacheResponse is a function');
    t.equals( typeof woden._getSettings, 'function', 'woden._getSettings is a function');
    t.equals( typeof woden._onProxyReq, 'function', 'woden._onProxyReq is a function');
    t.equals( typeof woden._onError, 'function', 'woden._onError is a function');
    t.end();
});

test( 'testing woden::when', function ( t ) {
    var woden = new Woden( { foo: 'bar' } );

    t.equals( Array.isArray( woden.settings ), true, 'a setting is an array' );
    t.equals( woden.settings.length, 0, 'a setting is an empty array' );

    woden.when( /hello/, {} );

    t.equals( woden.settings.length, 1, 'a setting is added to woden.settings' );
    t.equals( woden.settings[ 0 ][ 0 ] instanceof RegExp, true, 'first param is a Regular Expression' );
    t.equals( typeof woden.settings[ 0 ][ 1 ], 'object', 'second param is an object' );
    t.end();
} );

test( 'testing woden::store', function( t ) {
    var woden = new Woden( { foo: 'bar' } );

    t.equals( typeof woden.storageAdapter, 'object', 'woden.storageAdapter is a object' );
    t.equals( typeof woden.store, 'function', 'woden.store is a function' );

    woden.store({ baz : 'qux' });
    t.equals( typeof woden.storageAdapter, 'object', 'woden.storageAdapter is a object' );
    t.equals( woden.storageAdapter.baz, 'qux', 'woden.storageAdapter now has the properties of the object passed in to store' );

    t.end();
});