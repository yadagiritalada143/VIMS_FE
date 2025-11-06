// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  NAME: 'Pre-Prod',
  production: true,
  demoMode: false,
  version: '0.0.1',
  SIMPLIFY_ORG_ID: 'a3c0c26d-c5bb-4e2a-ab04-99a705639366',
  newReportFeatureAllowed: true,
  API_ENDPOINT: 'https://preprod-services.simplifyvms.com',
  REPORT_API_ENDPOINT: 'https://preprod-reports.simplifyvms.com',
  MOCK_ENDPOINT: 'https://preprod-services.simplifyvms.com',
  SSO_URL:
    'https://uat-sso.simplifyvms.com/oauth2/authorize?client_id=6ljaspmiffkkgc5ga83irv1dme&response_type=code&scope=email+openid&redirect_uri=https://preprod-app.simplifyvms.com/auth/login',
  SSO_REDIRECT_URL: 'https://preprod-app.simplifyvms.com/auth/login',
  FRONTEND_APP_URL: 'https://preprod-app.simplifyvms.com',
  MATOMO_SITE_ID: '4',
  BANNER_BACKGROUND_COLOR: '#ee800e',
  CMS_ENDPOINT: 'https://uat-cms.simplifyvms.com',
  SOW_URL: 'https://preprod-sow.simplifyvms.com',
  RFX_URL: 'https://preprod-rfx.simplifyvms.com',
  PARSING_URL: 'https://jdext.simplify-ai.com',
  CRYPTO_KEY : 'B110F47FA7CA42FC',
  CRYPTO_IV : '39257612CDC3470C',
  // I18:'https://event-service.appbuilder.platform-us-prod.simplifyvmsapp.com'
  I18:'https://event-service.appbuilder.platform-qa.simplifysandbox.net/',
  REPORTING_MODULE_URL: "https://analytics-sdk-dev.bridge.platform-qa.simplifysandbox.net",
  PLATFORM_BRIDGE_URL: 'https://bridgefe-uat.bridge.platform-qa.simplifysandbox.net/',
  CREDENTIALING_SCRIPT_URL: 'https://cred-preprod.simplifyvmsapp.com/credWidgetLibrary.js',
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY_HERE',  // Replace with actual public key
  CREDENTIALING_URL: "https://event-service.vmsv2.platform-uat.simplifyvmsapp.com"
};
