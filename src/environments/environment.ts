// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  demoMode: false,
  version: '0.0.1',
  SIMPLIFY_ORG_ID: 'a3c0c26d-c5bb-4e2a-ab04-99a705639366',
  newReportFeatureAllowed : false,



  //Enable this in UAT /
  // API_ENDPOINT: 'https://uat-services-wipro.simplifyvms.com',
  // MOCK_ENDPOINT: 'https://uat-services-wipro.simplifyvms.com',
  // SSO_URL: 'https://sso-wipro.simplifyvms.com/oauth2/authorize?client_id=6ljaspmiffkkgc5ga83irv1dme&response_type=code&scope=email+openid&redirect_uri=https://uat-app-wipro.simplifyvms.com/auth/login',
  // SSO_REDIRECT_URL: "https://uat-app-wipro.simplifyvms.com/auth/login",
  // MATOMO_SITE_ID: '2',
  // FRONTEND_APP_URL: "https://qa-app.simplifysandbox.net",
  // NAME:'UAT'

  // Enable this in QA
  // API_ENDPOINT: 'https://qa-services.simplifysandbox.net',
  // MOCK_ENDPOINT: 'https://qa-services.simplifysandbox.net',
  // SSO_URL: 'https://simplifyvms.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1onvptnstmvtclpkfpbjc4jqp&response_type=code&scope=email+openid&redirect_uri=https://qa-app.simplifysandbox.net/auth/login',
  // SSO_REDIRECT_URL: "https://qa-app.simplifysandbox.net/auth/login",
  // FRONTEND_APP_URL: "https://qa-app.simplifysandbox.net",
  // SOW_URL: 'https://dev-sow.simplifysandbox.net',
  // MATOMO_SITE_ID: '2',
  // BANNER_BACKGROUND_COLOR: '#ee800e',
  // REPORT_API_ENDPOINT: 'https://qa-reports.simplifysandbox.net',
  // NAME:'QA',
  // CMS_ENDPOINT: 'https://qa-services.simplifysandbox.net'

  // Enable this for Dev
  SSO_URL:
    'https://simplifyvms.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1onvptnstmvtclpkfpbjc4jqp&response_type=code&scope=email+openid&redirect_uri=https://dev-app.simplifysandbox.net/auth/login',
  SSO_REDIRECT_URL: 'https://dev-app.simplifysandbox.net/auth/login',
  API_ENDPOINT: 'https://dev-services.simplifysandbox.net',
  REPORT_API_ENDPOINT: 'https://dev-reports.simplifysandbox.net',
  MOCK_ENDPOINT: 'https://dev-services.simplifysandbox.net',
  CMS_ENDPOINT: 'https://dev-cms.simplifysandbox.net',
  SOW_URL: 'https://dev-sow.simplifysandbox.net',
  RFX_URL: 'https://dev-rfx.simplifysandbox.net',
  MATOMO_SITE_ID: '2',
  NAME: 'Development',
  BANNER_BACKGROUND_COLOR: '#FFFFFF',
  PARSING_URL: 'https://dev-jdext.simplify-ai.com',
  CRYPTO_KEY : 'B110F47FA7CA42FC',
  CRYPTO_IV : '39257612CDC3470C',
  I18:'https://event-service.appbuilder.platform-qa.simplifysandbox.net/',
  REPORTING_MODULE_URL: "https://analytics-sdk-dev.bridge.platform-qa.simplifysandbox.net",
  PLATFORM_BRIDGE_URL: 'https://bridgefe-feature.bridge.platform-qa.simplifysandbox.net/',
  CREDENTIALING_SCRIPT_URL: 'https://cred-widgets.appbuilder.app.svmssandbox.net/credWidgetLibrary.js'
};
