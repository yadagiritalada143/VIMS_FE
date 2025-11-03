// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  demoMode: false,
  version: '0.0.1',
  SIMPLIFY_ORG_ID: 'a3c0c26d-c5bb-4e2a-ab04-99a705639366',

  //Enable this in UAT /
  API_ENDPOINT: 'https://services-eu.simplifyvms.com',
  REPORT_API_ENDPOINT: 'https://reports-eu.simplifyvms.com',
  MOCK_ENDPOINT: 'https://services-eu.simplifyvms.com',
  SSO_URL: 'https://sso-wipro.simplifyvms.com/oauth2/authorize?client_id=3lbut4tev9v9431v2sp8ohag6j&response_type=code&scope=email+openid&redirect_uri=https://wipro-global.simplifyvms.com/auth/login',
  SSO_REDIRECT_URL: "https://wipro-global.simplifyvms.com/auth/login",
  FRONTEND_APP_URL: "https://wipro-global.simplifyvms.com",
  SOW_URL: 'https://services-eu.simplifyvms.com',
  RFX_URL: 'https://services-eu.simplifyvms.com',
  PARSING_URL: 'https://jdext.simplify-ai.com',

  MATOMO_SITE_ID: '5',
  BANNER_BACKGROUND_COLOR: '#FFFFFF',
  CRYPTO_KEY : 'B110F47FA7CA42FC',
  CRYPTO_IV : '39257612CDC3470C',
  // I18:'https://event-service.appbuilder.platform-us-prod.simplifyvmsapp.com'
  I18:'https://event-service.appbuilder.platform-qa.simplifysandbox.net/',
  REPORTING_MODULE_URL: "https://analytics-sdk-dev.bridge.platform-qa.simplifysandbox.net",
  PLATFORM_BRIDGE_URL: 'https://bridgefe-feature.bridge.platform-qa.simplifysandbox.net/',
  CREDENTIALING_SCRIPT_URL: 'https://cred-widgets.appbuilder.platform-qa.simplifysandbox.net/credWidgetLibrary.js'
  //Enable this in QA /
  // API_ENDPOINT: 'https://qa-services.simplifysandbox.net',
  // MOCK_ENDPOINT: 'https://qa-services.simplifysandbox.net',
  // SSO_URL: 'https://simplifyvms.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1onvptnstmvtclpkfpbjc4jqp&response_type=code&scope=email+openid&redirect_uri=https://qa-app.simplifysandbox.net/auth/login',
  // SSO_REDIRECT_URL: "https://qa-app.simplifysandbox.net/auth/login",

  //Enable this for Dev
  //  SSO_URL: 'https://simplifyvms.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1onvptnstmvtclpkfpbjc4jqp&response_type=code&scope=email+openid&redirect_uri=https://dev-app.simplifysandbox.net/auth/login',
  //  SSO_REDIRECT_URL: "https://dev-app.simplifysandbox.net/auth/login",
  //  API_ENDPOINT: 'https://dev-services.simplifysandbox.net',
  //  MOCK_ENDPOINT: 'https://dev-services.simplifysandbox.net',


};
