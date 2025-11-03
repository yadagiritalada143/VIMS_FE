import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder/dynamic-html-template-builder.service';
import { NotificationConfigService } from '../notification-config.service';
@Component({
  selector: 'app-preferences',
  templateUrl: './preferences.component.html',
  styleUrls: ['./preferences.component.scss']
})
export class PreferencesComponent implements OnInit {
  templateDesignerConfig:any = null;
  notificationconfigs: any[] = [
    {
      'module': 'Domains',
      'events': [
        // { TODO: might be used later
        //   'name': 'Whitelist',
        //   'description': 'Manage the whitelisted domains to which notifications can be sent',
        //   'navigateTo': '/notification/config/domain-based-settings/Whitelist'
        // },

        // {
        //   'name': 'Whitelist',
        //   'description': 'Manage the whitelisted domains to which notifications can be sent',
        //   'navigateTo': '/notification/config/domain-based-settings/whitelist'
        // },
        {
          'name': 'Blacklist',
          'description': 'Maintain the list of domains which will be in the blacklist',
          'navigateTo': '/notification/config/domain-based-settings/blacklist'
        }
      ]
    },
    {
      'module': 'Emails',
      'events': [
        {
          'name': 'Always CC',
          'description': 'List of emails which should be aways CCd.',
          'navigateTo': '/notification/config/email-based-settings/Always CC'
        },
        {
          'name': 'Always BCC',
          'description': 'List of emails which should be aways BCCd.',
          'navigateTo': '/notification/config/email-based-settings/Always BCC'
        },
        {
          'name': 'Blacklisted Emails',
          'description': 'List of emails which are blacklisted',
          'navigateTo': '/notification/config/email-based-settings/Blacklisted Emails'
        }
      ]
    } ,
    // {
    //   'module': 'User role Preferences',
    //   'events': [
    //     {
    //       'name': 'Role based notification preferences',
    //       'description': 'Here you can manage the notifications for each role.',
    //       'navigateTo': '/notification/config/role-based-settings'
    //     }
    //   ],
    // }
  ]
  searchTerm: string = '';
  filteredNotificationconfig: any[] = JSON.parse(JSON.stringify(this.notificationconfigs));
  programId = '';
  defaulted: boolean = false;
  isHeaderTemplateExist = true;
  entityIDHeader: any = 1;
  entityIDFooter: any = 1;
  isHeader: boolean = false;
  isFooter: boolean = false;
  isFooterTemplateExist = true;
  constructor(public eventStream: EventStreamService,
    private dynamicHtmlTemplateBuilderService:DynamicHtmlTemplateBuilderService,
    private localStorage: StorageService,
    private notificationConfigService: NotificationConfigService,
    private _alert: AlertService,
    private loader: LoaderService,
    private appRoute: SvmsRouterService) { }

  ngOnInit(): void {
    this.programId = this.localStorage.get("PROGRAM_ID");
    this.getTemplateHeader();
    this.getTemplateFooter();
  }

  getTemplateHeader(){
    this.notificationConfigService.getTemplateConfig('header', this.programId).subscribe((res:any) => {
        this.entityIDHeader = res?.entityId ?? 1;
        this.isHeader = false;
      if (res?.message === "Config not found!") {
        this.notificationConfigService.headerConfig$.next(null);
        this.isHeaderTemplateExist = false;
      }
    },
      (error) => {
        this.notificationConfigService.headerConfig$.next(null);
        this.isHeaderTemplateExist = false;
      });
  }

  getTemplateFooter(){
    this.notificationConfigService.getTemplateConfig('footer', this.programId).subscribe((res:any) => {
        this.entityIDFooter = res?.entityId ?? 1;
        this.isFooter = false;
      if (res?.message === "Config not found!") {
        this.notificationConfigService.footerConfig$.next(null);
        this.isFooterTemplateExist = false;
      }
    },
      (error) => {
        this.notificationConfigService.footerConfig$.next(null);
        this.isFooterTemplateExist = false;
      });
  }
  setSearchParam(data: string) {
    this.searchTerm = data.toLowerCase();
    this.updateFilteredData();
  }
  updateFilteredData(): void {
    if (this.searchTerm === '') {
      this.filteredNotificationconfig = JSON.parse(JSON.stringify(this.notificationconfigs));
      return;
    }
    else {
      this.filteredNotificationconfig = [];
      this.notificationconfigs.forEach(module => {
        let found: boolean = false;
        for (var lnIndex = 0; lnIndex < module?.events?.length; lnIndex++) {
          if (String(module?.events[lnIndex].name.toLowerCase()).search(this.searchTerm) !== -1) {
            found = true;
          }
        }
        if (found) {
          let configObj = {
            module: module.module,
            events: []
          }
          for (var lnIndex = 0; lnIndex < module?.events?.length; lnIndex++) {
            if (String(module?.events[lnIndex].name.toLowerCase()).search(this.searchTerm) !== -1) {
              let eventObj = {
                name: module?.events[lnIndex].name,
                description: module?.events[lnIndex].description
              }
              configObj.events.push(eventObj);
              this.filteredNotificationconfig.push(configObj);
            }
          }

        }
      });

    }
  }

  templateKeys: any = {
    'Header' : 'headerTemplate',
    'Footer' : 'footerTemplate'
  }

  editHeaderFooter(value:any) {
    let config = null;
    
    this.templateDesignerConfig = {
      type: value,
      config: config
    }
    if (value === "Header") {
      const res = this.notificationConfigService.headerConfig$.getValue();
      if ( this.templateDesignerConfig) {
        this.templateDesignerConfig.config =res?.value?.payload?.config;
      }
    }
    else {
      const res = this.notificationConfigService.footerConfig$.getValue();
      if ( this.templateDesignerConfig) {
        this.templateDesignerConfig.config =res?.value?.payload?.config;
      }
    }
  }

  // navigateback() {
    // this.appRoute.navigate(['notification', 'config', 'list']);
    // this.appRoute.navigate(['notifications', 'preferences']);

  // }

  navigateToLink(url: string) {
    if(url) {
      this.appRoute.navigate((url?.split('/')?.filter((fragment: string) => fragment) || []));
    }
  }

  templateDesignerClosed(event:any){
    if(!event) {
      this.templateDesignerConfig = null;
      return;
    }
    const { type, config, template } = event;
    if (type === 'Header') {
      const res = this.notificationConfigService.headerConfig$.getValue();
      let headerTemplate = res || {
        value:{
          payload:{
            config:null
          }
        }
      };
      if(!headerTemplate?.value){
        headerTemplate.value= { payload:{ config:null } };
      }
      headerTemplate.value.payload.config = this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(config)
      this.notificationConfigService.headerConfig$.next(headerTemplate);
    } else if (type === 'Footer') {
      const res = this.notificationConfigService.footerConfig$.getValue();
      let footerTemplate = res || {
        value:{
          payload:{
            config:null
          }
        }
      };;
      if(!footerTemplate?.value){
        footerTemplate.value= { payload:{ config:null } };
      }
      footerTemplate.value.payload.config = this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(config)
      this.notificationConfigService.footerConfig$.next(footerTemplate);
    }
    this.loader.show();
    let updatingExistingTemplate;
    const requestData = {
      id: undefined,
      dataType: "Map",
      refId: this.programId, // we need to use programid as refId
      key: type === 'Header' ? 'email_header' : 'email_footer',
      uiType: "FrontEnd",
      value: {
        payload: {
          config: this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(config),
          template,
        }
      }
    };
    let defaulted;
    if (type === 'Header') {
      const res = this.notificationConfigService.headerConfig$.getValue();
      defaulted = res?.defaulted;
      this.isHeader = true;
      updatingExistingTemplate = res?.value?.payload?.config
      if (updatingExistingTemplate && this.entityIDHeader != 1) {
        requestData.id = res?.id
      }
    }
    else {
      const res = this.notificationConfigService.footerConfig$.getValue();
      defaulted = res?.defaulted;
      this.isFooter = true;
      updatingExistingTemplate = res?.value?.payload?.config
      if (updatingExistingTemplate && this.entityIDFooter != 1) {
        requestData.id = res?.id
      }

    }
    // this.notificationConfigService[updatingExistingTemplate && !defaulted ? 'putTemplate' : 'postTemplate'](`/tenant-config/`, requestData).subscribe((response: any) => {
    this.notificationConfigService[updatingExistingTemplate && !defaulted &&  ((this.isHeader && this.entityIDHeader != 1) || (this.isFooter && this.entityIDFooter != 1))? 'putsTemplate' : 'postsTemplate'](`/notification-config/tenant-config/`, requestData).subscribe((response: any) => {
      if (type === 'Header') {
        this.notificationConfigService.headerConfig$.next(response?.payload);
          this.getTemplateHeader();
      } else {
        this.notificationConfigService.footerConfig$.next(response?.payload);
          this.getTemplateFooter();
      }
     
      this._alert.success(`${type} saved successfully`);
      this.loader.hide();
    },
      err => {
        if (err) {
          this._alert.error(errorHandler(err));
        }
        this.loader.hide();
      });
    this.templateDesignerConfig = null;
  }

}
