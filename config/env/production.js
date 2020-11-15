module.exports = {

  /**************************************************************************
   *                                                                         *
   * Tell Sails what database(s) it should use in production.                *
   *                                                                         *
   * (https://sailsjs.com/config/datastores)                                 *
   *                                                                         *
   **************************************************************************/
  datastores: {},

  models: {
    migrate: 'safe',
  },

  blueprints: {
    shortcuts: false,
  },

  /***************************************************************************
   *                                                                          *
   * Configure your security settings for production.                         *
   *                                                                          *
   * IMPORTANT:                                                               *
   * If web browsers will be communicating with your app, be sure that        *
   * you have CSRF protection enabled.  To do that, set `csrf: true` over     *
   * in the `config/security.js` file (not here), so that CSRF app can be     *
   * tested with CSRF protection turned on in development mode too.           *
   *                                                                          *
   ***************************************************************************/
  security: {

    /***************************************************************************
     *                                                                          *
     * If this app has CORS enabled (see `config/security.js`) with the         *
     * `allowCredentials` setting enabled, then you should uncomment the        *
     * `allowOrigins` whitelist below.  This sets which "origins" are allowed   *
     * to send cross-domain (CORS) requests to your Sails app.                  *
     *                                                                          *
     * > Replace "https://example.com" with the URL of your production server.  *
     * > Be sure to use the right protocol!  ("http://" vs. "https://")         *
     *                                                                          *
     ***************************************************************************/
    cors: {
      // allowOrigins: [
      //   'https://example.com',
      // ]
    },

  },

  session: {

    cookie: {
      // secure: true,
      maxAge: 24*60*60*1000,  // 24 hours
    },

  },

  log: {
    level: 'warn',
  },

  http: {

    cache: 365.25*24*60*60*1000, // One year

  },

  port: 80,

  custom: {

    baseUrl: 'http://localhost',

  },

};
