'use strict';

var TinyCache = require( 'tinycache' ),
    tinycache = new TinyCache( );

module.exports = {
    get: function( key, callback ) {
        callback( null, tinycache.get( key ) );
    },
    set: function( key, value, time, callback ) {
        tinycache.put( key, value, time );
        callback( );
    }
};