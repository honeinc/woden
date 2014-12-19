# Woden [![Build Status](https://travis-ci.org/honeinc/woden.svg?branch=master)](https://travis-ci.org/honeinc/woden)

![Woden](https://cloud.githubusercontent.com/assets/273857/5469053/e6c140a2-858b-11e4-97b1-ee4c1a39d352.png)

Woden is a module that allows you to run a proxy server that will cache request.

## Install 

    $ npm install node-proxy-cache
    
## Usage

```javascript
var Woden = require( 'woden' ),
    woden = new Woden({}),
    DS = {};
    
woden.when( /google/, {
    getKey: function( path, query ) { // allows you to generate keys
        return 'foo:' + path; 
    },
    headers: {
        'X-Bar': 'Baz' // set custom headers when sending to proxy
    },
    caching: false // don't cache responses from google
});

woden.when( /foo.org/, {
    cacheTime: function( cacheEntry, req, proxyRes ) {
        if ( cacheEntry.body.length > 10000000 ) {
            return -1; // don't cache big responses
        }

        if ( req.url.match( /bar/) ) {
            return 0; // cache bar stuff forever
        }

        if ( proxyRes.statusCode === 404 ) {
            return -1; // don't cache 404 responses
        }

        return 10000; // only cache for 10 seconds
    }  
});

woden.store({ // custom storeAdapter
    get: function( key, callback ) {
        callback( null, DS[key] ); // getting information
    },
    set: function( key, value, callback ) { // setting values to store
        DS[ key ] = value; // value.body is a buffer 
        callback( );
    }
});

woden.listen( 9000 ); // listen on port
```

##### Hitting server

    $ curl -L -G -d "\$url=http://google.com" http://localhost:9000/
    
to set the url of the page to proxy to, set the `$url` param. Also if you need to specify a path you can either do that in the $url param or on the original.

    $ curl -L -G -d "\$url=http://google.com" http://localhost:9000/imghp

or 

    $ curl -L -G -d "\$url=http://google.com/imghp" http://localhost:9000
  
