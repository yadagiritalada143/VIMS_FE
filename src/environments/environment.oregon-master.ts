// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: true,
    demoMode: false,
    version: '0.0.1',
    SIMPLIFY_ORG_ID: 'a3c0c26d-c5bb-4e2a-ab04-99a705639366',
    newReportFeatureAllowed : false,
  
    //Enable this in PROD /
    API_ENDPOINT: 'https://services-or.simplifyvmsapp.com',
    REPORT_API_ENDPOINT: 'https://reports.simplifyvms.com',
    MOCK_ENDPOINT: 'https://services-or.simplifyvmsapp.com',
    SSO_URL:
      'https://sso.simplifyvms.com/oauth2/authorize?client_id=3lbut4tev9v9431v2sp8ohag6j&response_type=code&scope=email+openid&redirect_uri=https://app.simplifyvms.com/auth/login',
    SSO_REDIRECT_URL: 'https://app.simplifyvms.com/auth/login',
    FRONTEND_APP_URL: 'https://app.simplifyvms.com',
    CMS_ENDPOINT: 'https://prod-cms.simplifyvms.com',
    MATOMO_SITE_ID: '5',
    BANNER_BACKGROUND_COLOR: '#FFFFFF',
    NAME: '',
    SOW_URL: 'https://sow.simplifyvms.com',
    RFX_URL: 'https://rfx.simplifyvms.com',
    PARSING_URL: 'https://jdext.simplify-ai.com',
    CRYPTO_KEY : 'B110F47FA7CA42FC',
    CRYPTO_IV : '39257612CDC3470C',
    // I18:'https://event-service.appbuilder.platform-us-prod.simplifyvmsapp.com'
    I18:'https://event-service.appbuilder.platform-qa.simplifysandbox.net/',
    REPORTING_MODULE_URL: "https://analytics-sdk.reporting.platform-us-prod.simplifyvmsapp.com",
    PLATFORM_BRIDGE_URL: 'https://bridgefe-feature.bridge.platform-qa.simplifysandbox.net/'
  };
  