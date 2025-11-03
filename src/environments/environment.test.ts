// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  API_ENDPOINT: 'https://qa-services.simplifysandbox.net',
  REPORT_API_ENDPOINT: 'https://qa-reports.simplifysandbox.net',
  MOCK_ENDPOINT: 'https://qa-services.simplifysandbox.net',
  SSO_URL:
    'https://simplifyvms.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1onvptnstmvtclpkfpbjc4jqp&response_type=code&scope=email+openid&redirect_uri=https://qa-app.simplifysandbox.net/auth/login',
  SSO_REDIRECT_URL: 'https://qa-app.simplifysandbox.net/auth/login',
  FRONTEND_APP_URL: 'https://qa-app.simplifysandbox.net',
  CMS_ENDPOINT: 'https://qa-cms.simplifysandbox.net',
  SOW_URL: 'https://qa-sow.simplifysandbox.net',
  RFX_URL: 'https://qa-rfx.simplifysandbox.net',
  PARSING_URL: 'https://qa-jdext.simplify-ai.com',
  demoMode: false,
  version: '0.0.1',
  SIMPLIFY_ORG_ID: 'a3c0c26d-c5bb-4e2a-ab04-99a705639366',
  MATOMO_SITE_ID: '3',
  BANNER_BACKGROUND_COLOR: '#1d7b17',
  NAME: 'QA',
  CRYPTO_KEY : 'B110F47FA7CA42FC',
  CRYPTO_IV : '39257612CDC3470C',
  // I18:'https://event-service.appbuilder.platform-us-prod.simplifyvmsapp.com'
  I18:'https://event-service.appbuilder.platform-qa.simplifysandbox.net/',
  REPORTING_MODULE_URL: "https://analytics-sdk-dev.bridge.platform-qa.simplifysandbox.net",
  PLATFORM_BRIDGE_URL: 'https://bridgefe-feature.bridge.platform-qa.simplifysandbox.net/',
  CREDENTIALING_SCRIPT_URL: 'https://cred-widgets.appbuilder.platform-qa.simplifysandbox.net/credWidgetLibrary.js'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
