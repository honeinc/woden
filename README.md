# Node Proxy Cache [![Build Status](https://travis-ci.org/honeinc/node-proxy-cache.svg?branch=master)](https://travis-ci.org/honeinc/node-proxy-cache)

proxy cache is a module that allows you to run a proxy server that will cache request.

## Install 

    $ npm install node-proxy-cache
    
## Usage

```javascript
var ProxyCache = require( 'node-proxy-cache' ),
    proxyCache = new ProxyCache({}),
    DS = {};
    
proxyCache.when( /google/, {
    getKey: function( path, query ) { // allows you to generate keys
      return 'foo:' + path; 
    },
    headers: {
        'X-Bar': 'Baz' // set custom headers when sending to proxy
    }
});

proxyCache.store({ // custom storeAdapter
    get: function( key, callback ) {
      callback( null, DS[key] ); // getting information
    },
    set: function( key, value, callback ) { // setting values to store
      DS[ key ] = value; // value.body is a buffer 
      callback( );
    }
});

proxy.listen( 9000 ); // listen on port
```

##### Hitting server

    $ curl -L -G -d "\$url=http://google.com" http://localhost:9000/
    
to set the url of the page to proxy to, set the `$url` param. Also if you need to specify a path you can either do that in the $url param or on the original.

    $ curl -L -G -d "\$url=http://google.com" http://localhost:9000/imghp

or 

    $ curl -L -G -d "\$url=http://google.com/imghp" http://localhost:9000
  
