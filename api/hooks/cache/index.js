/**
 * CACHE hook for global use
 **/

module.exports = function defineCacheHook(sails) {
  const nodeCache = require('node-cache');
  let stores      = {};

  return {

    store: (name, ttl) => {
      if(_.isEmpty(name)) throw new Error('Missing store parameters');
      if(!_.isEmpty(stores[name])) {
        return stores[name];
      } else {
        stores[name] = new nodeCache({
          stdTTL     : ttl || 0,
          checkperiod: ttl ? ttl*0.2 : 0,
          useClones  : false,
        });
        return stores[name];
      }
    },

    isAlive: (name) => {
      if(_.isEmpty(name)) throw new Error('Missing store parameters');
      return _.has(stores, name);
    },

    /* Runs when this Sails app loads/lifts. */
    initialize: async function() {

      sails.log.info('Initializing custom hook cache store');

    },

  };

};

