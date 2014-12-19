'use strict';

var TinyCache = require( 'tinycache' ),
    tinycache = new TinyCache( );

module.exports = {
    get: function( key, callback ) {
        callback( null, tinycache.get( key ) );
    },
    set: function( options, callback ) {
        tinycache.put( options.key, options.value, options.timeout );
        callback( );
    }
};