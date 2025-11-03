// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
export const environment = {
    production: true,
    demoMode: false,
    version: '0.0.1',
    newReportFeatureAllowed : false,
    SIMPLIFY_ORG_ID: 'a3c0c26d-c5bb-4e2a-ab04-99a705639366',
    SSO_URL:
      'https://simplifyvms.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=1onvptnstmvtclpkfpbjc4jqp&response_type=code&scope=email+openid&redirect_uri=https://dev-app.simplifysandbox.net/auth/login',
    SSO_REDIRECT_URL: 'https://dev-impl-app.simplifysandbox.net/auth/login',
    API_ENDPOINT: 'https://dev-impl-services.simplifysandbox.net',
    REPORT_API_ENDPOINT: 'https://dev-impl-reports.simplifysandbox.net',
    MOCK_ENDPOINT: 'https://dev-impl-services.simplifysandbox.net',
    CMS_ENDPOINT: 'https://dev-cms.simplifysandbox.net',
    SOW_URL: 'https://dev-impl-sow.simplifysandbox.net',
    MATOMO_SITE_ID: '2',
    BANNER_BACKGROUND_COLOR: '#FFFFFF',
    NAME: 'Development-US',
    // I18:'https://event-service.appbuilder.platform-us-prod.simplifyvmsapp.com'
    I18:'https://event-service.appbuilder.platform-qa.simplifysandbox.net/',
    REPORTING_MODULE_URL: "https://analytics-sdk-dev.bridge.platform-qa.simplifysandbox.net",
  PLATFORM_BRIDGE_URL: 'https://bridgefe-feature.bridge.platform-qa.simplifysandbox.net/',
  CREDENTIALING_SCRIPT_URL: 'https://cred-widgets.appbuilder.app.svmssandbox.net/credWidgetLibrary.js'
  };
  /*
   * For easier debugging in development mode, you can import the following file
   * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
   *
   * This import should be commented out in production mode because it will have a negative impact
   * on performance if an error is thrown.
   */
  // import 'zone.js/dist/zone-error';  // Included with Angular CLI.
