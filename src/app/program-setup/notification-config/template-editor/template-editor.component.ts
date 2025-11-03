import { Location } from '@angular/common';
import { Component, OnInit, Output, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { TemplateRenderComponent } from '../../dynamic-html-template-builder/components/template-render/template-render.component';
import { DynamicHtmlTemplateBuilderService } from '../../dynamic-html-template-builder/dynamic-html-template-builder.service';
import { prefix, suffix } from '../config';
import { NotificationConfigService } from '../notification-config.service';
import { lookup } from '../notification-configs.utils';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss']
})
export class TemplateEditorComponent implements OnInit {
  previewMode: string = 'email';
  @Output() editorType: string = 'content';

  @ViewChildren(TemplateRenderComponent) renderes;
  programId: string;
  pushNotificationFields = {
    title : '' ,
    details : '',
    body: '',
    recipients: ''
  }
  bodyConfigValue:any = null;
  event = {
    eventCode: '',
    eventId: '',
    name: ''
  }
  templateDetails: any = {
    emailTemplate: {
      body: '',
      subject: '',
      additionalConfig: null
    },
    notificationConfig:{
      emailConfig:{
        header:'',
        body:'',
        footer:''
      },
      include_header: true,
      include_footer: true,
      active: true
    },
    recipient: {
      keys: [],
      customEmails: '',
      roles: [],
      excludeEmails: '',
    },
    schema: [],
  };

  hasEmailTemplate: boolean;
  templateDesignerConfig: any=null;
  isChecked: any;
  headerData: string;
  footerData: any;
  dropdownOptions: any = {
    actors : [
      { name: 'Client', value: 'client'},
      { name: 'MSP', value: 'msp'},
      { name: 'Vendor', value: 'vendor'},
      { name: 'Worker', value: 'worker'},
      { name: 'Candidate', value: 'candidate'},
      { name: 'Custom', value: 'custom'},
      { name: 'SOW Owner', value: 'Sow_owner'},
      { name: 'Member', value: 'member'},
      // { name: 'Delegator', value: 'delegator'},
      { name: 'Any', value: 'Any'}
    ]
  }
  isRootTemplate: boolean=false;
  isRootLevelTemplete: boolean;
  notificationData: any;
  eventData: any;
  constructor(private notificationConfigService: NotificationConfigService,
    private storageService: StorageService,
    private route: ActivatedRoute,
    private _alert: AlertService,
    private dynamicHtmlTemplateBuilderService:DynamicHtmlTemplateBuilderService,
    private loader: LoaderService,
    private location: Location) { }

  allowOnlyRootLevel;
  ngOnInit(): void {
    this.eventData = JSON.parse(localStorage.getItem('eventData'));
    this.allowOnlyRootLevel = this.eventData?.allowOnlyRootLevelTemplates === true || false;
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.notificationConfigService.headerConfig$.subscribe((res) => {
      this.templateDetails.notificationConfig.emailConfig.header = res?.value?.payload?.config || '{}';
    })
    this.notificationConfigService.footerConfig$.subscribe((res) => {
      this.templateDetails.notificationConfig.emailConfig.footer = res?.value?.payload?.config || '{}';
    })
    this.notificationConfigService.getTemplateConfig('header', this.allowOnlyRootLevel ? 'simplifyvms' : this.programId).subscribe((res) => this.templateDetails.notificationConfig.emailConfig.header = (res?.value?.payload?.config || '{}'));
    this.notificationConfigService.getTemplateConfig('footer', this.allowOnlyRootLevel ? 'simplifyvms' : this.programId).subscribe((res) => this.templateDetails.notificationConfig.emailConfig.footer = (res?.value?.payload?.config || '{}'));
    this.getTemplateById();
  }

  getTemplateById() {
    this.loader.show();
    this.event.eventCode = this.eventData?.eventCode;
    this.event.name = this.eventData?.eventName;
    console.log(this.route.snapshot.params);
    this.event.eventId = this.route.snapshot.params.id;
    if(this.storageService.get("SYSTEM_DEFAULT") === true){
      this.programId = "SYSTEM_DEFAULT";
    }
    // this.notificationConfigService.get(`/template/admin/search?code=${this.event.eventCode}&refId=${this.allowOnlyRootLevel ? 'simplifyvms' : this.programId}&language=en`).subscribe((response: any) => {
    this.notificationConfigService.gets(`/notification-config/template/admin/search?code=${this.event?.eventCode}&refId=${this.allowOnlyRootLevel ? 'simplifyvms' : this.programId}&language=en`).subscribe((response: any) => {
      if (response?.payload) {
        response?.payload?.forEach(element => {
          if(!element?.role) {
            element.parent_template = `${element?.role ?? 'No Role'} (${element.language})`
          }
        });
        this.isRootLevelTemplete = response?.payload[0]?.refId === 'simplifyvms';
        this.dropdownOptions['allTemplates'] = response.payload;
        this.notificationData = response?.payload[0];
        this.assignTemplate(response?.payload[0]);
      } else {
        this.hasEmailTemplate = false;
      }
      this.loader.hide();
      // this.transformHeader();
    },
      err => {
        this._alert.error(errorHandler(err));
        this.loader.hide();
      });
  }

  onChange(event) {
    this.isRootLevelTemplete = false;
    let matchedTemplate = this.dropdownOptions['allTemplates']?.find(template =>
      (template.role == this.dropdownOptions['actor'] && template.language == 'en' && template.roleRecipient == this.dropdownOptions['roleRecipient']));
    this.dropdownOptions['cloneTemplateId'] = null;
    if(matchedTemplate) {
      this.templateDetails = {
        ...this.templateDetails,
        ...matchedTemplate,
        notificationConfig: {
          ...this.templateDetails.notificationConfig,
          ...(matchedTemplate?.notificationConfig || {})
        },
        emailTemplate: {
          ...this.templateDetails.emailTemplate,
          ...(matchedTemplate?.emailTemplate || {})
        },
        recipient: {
          ...this.templateDetails.recipient,
          ...(matchedTemplate?.recipient || {}),
          roles: (matchedTemplate?.recipient?.roles || []).map(role => role.id)
        }
      };
      this.isRootLevelTemplete = this.templateDetails.refId === 'simplifyvms';
      this.templateDetails.notificationConfig.active = typeof this.templateDetails.notificationConfig.active === 'boolean' && this.templateDetails.notificationConfig.active === false  ? false : true;
      matchedTemplate?.emailTemplate && (this.hasEmailTemplate = true);
    } else {
      this.templateDetails = {
        ...this.templateDetails,
        emailTemplate: {
          body: '',
          subject: '',
          additionalConfig: null
        },
        notificationConfig:{
          emailConfig:{
            header:'',
            body:'',
            footer:'',
          },
          include_header: true,
          include_footer: true,
          active: true
        },
        recipient: {
          keys: [],
          customEmails: '',
          roles: [],
          excludeEmails: '',
        },
        schema: [],
        pushTemplate: null
      };
      this.templateDetails.notificationConfig.active = typeof this.templateDetails.notificationConfig.active === 'boolean' && this.templateDetails.notificationConfig.active === false  ? false : true;
      this.notificationConfigService.headerConfig$.subscribe((res) => {
        this.templateDetails.notificationConfig.emailConfig.header = res.value?.payload?.config || '{}';
      })
      this.notificationConfigService.footerConfig$.subscribe((res) => {
        this.templateDetails.notificationConfig.emailConfig.footer = res.value?.payload?.config || '{}';
      })
      this.hasEmailTemplate = false;
      this.isRootLevelTemplete = false;
    }
    if(this.templateDetails.pushTemplate && this.hasEmailTemplate){
      this.pushNotificationFields.title = this.templateDetails.pushTemplate.title
      this.pushNotificationFields.details = this.templateDetails.pushTemplate.details
      this.pushNotificationFields.body = this.templateDetails.pushTemplate.body
      this.pushNotificationFields.recipients = this.templateDetails.pushTemplate.recipients
    } else {
      this.pushNotificationFields.title  = '';
      this.pushNotificationFields.details  = '';
      this.pushNotificationFields.body = '';
      this.pushNotificationFields.recipients = '';
    }
  }
  assignTemplate(response) {
    //reading item[0] for now;
    const payload = response;
    // const payload = response.payload[0];
    // this.dropdownOptions['allTemplates'] = response.payload;
    if(!payload) {
      this.templateDetails.notificationConfig.emailConfig.body = "";
      this.templateDetails.emailTemplate={
          body: '',
          subject: '',
          additionalConfig: null
        }
      return;
    }
    this.templateDetails = {
      ...this.templateDetails,
      ...payload,
      notificationConfig: {
        ...this.templateDetails.notificationConfig,
        ...(payload?.notificationConfig || {})
      },
      emailTemplate: {
        ...this.templateDetails.emailTemplate,
        ...(payload?.emailTemplate || {})
      },
      recipient: {
        ...this.templateDetails.recipient,
        ...(payload?.recipient || {}),
        roles: (payload?.recipient?.roles || []).map(role => role.id)
      }
    };
    this.templateDetails.notificationConfig.active = typeof this.templateDetails.notificationConfig.active === 'boolean' && this.templateDetails.notificationConfig.active === false  ? false : true;
    payload?.emailTemplate && (this.hasEmailTemplate = true);
    this.dropdownOptions['actor'] = payload.role;
    this.dropdownOptions['language'] = payload.language;
    this.dropdownOptions['roleRecipient'] = payload.roleRecipient;
    if(this.templateDetails && this.templateDetails.pushTemplate){
      this.pushNotificationFields.title  = this.templateDetails.pushTemplate.title
      this.pushNotificationFields.details  = this.templateDetails.pushTemplate.details
      this.pushNotificationFields.body = this.templateDetails.pushTemplate.body
      this.pushNotificationFields.recipients = this.templateDetails.pushTemplate.recipients
    }
    }

  transformHeader() {
    if (this.templateDetails?.notificationConfig.emailConfig?.header?.length > 0) {
     const matchedContent = this.templateDetails?.notificationConfig?.emailConfig?.header?.match(/{\w*}/g);
      if (matchedContent?.length > 0) {
        const currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
        matchedContent.forEach(content => {
          let key = content?.replace('{', '')?.replace('}', '');
          const value = lookup(currentProgram, key);
          if (value) {
            this.templateDetails.notificationConfig.emailConfig.header = this.templateDetails?.notificationConfig?.emailConfig?.header?.replace(content, value);
            this.templateDetails.notificationConfig.emailConfig.footer = this.templateDetails?.notificationConfig?.emailConfig?.footer?.replace(content, value);
          }
        });
      }
    }
  }

  onTemplateChange(event) {
    if (event) {
      let matchedTemplate = this.dropdownOptions['allTemplates']?.find(item =>
        (this.dropdownOptions['cloneTemplateId'] == item.id));
      if (matchedTemplate) {
        this.templateDetails = {
          ...this.templateDetails,
          ...matchedTemplate,
          notificationConfig: {
            ...this.templateDetails.notificationConfig,
            ...this.templateDetails.notificationConfig.emailConfig.body,
            ...(matchedTemplate?.notificationConfig || {})
          },
          emailTemplate: {
            ...this.templateDetails.emailTemplate,
            ...this.templateDetails.emailTemplate.body,
            ...(matchedTemplate?.emailTemplate || {})
          },
          recipient: {
            ...this.templateDetails.recipient,
            ...(matchedTemplate?.recipient || {}),
            roles: (matchedTemplate?.recipient?.roles || []).map(role => role.id)
          }
        };
        this.templateDetails.notificationConfig.active = typeof this.templateDetails.notificationConfig.active === 'boolean' && this.templateDetails.notificationConfig.active === false  ? false : true;
        matchedTemplate?.emailTemplate && (this.hasEmailTemplate = false);
      }
    } else {
      this.onChange(null);
    }
  }

  updateContent({ value, type }) {
    this[type] = { ...value };
  }

  previewClicked(type) {
    this.editorType = type;
  }

  changePreviewMode(value) {
    this.previewMode = value;
  }

  getField(eventCode){
    this.notificationConfigService.puts(`/notification-config/${this.programId}/event/field`, {  eventCode: eventCode,
      isCustomized: true}).subscribe((res: any) => {
        this.loader.hide();
      },
    err => {
      this._alert.error(errorHandler(err));
        this.loader.hide();
    })
  }

  templateSaveClicked(template) {
    const bodyTemplate = (this.renderes || []).find(render => render.id === 'body');
    if(template?.check) {
      this.templateDetails.pushTemplate = template.notifactionDetails;
    } else {
      this.checkValidationOfBodyAndSubject(bodyTemplate);
    }
    this.loader.show();
    const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const { eventCode, eventId } = this.event;
    const {  body } = this.templateDetails?.notificationConfig?.emailConfig || {};

    if(this.dropdownOptions['cloneTemplateId'] && !this.hasEmailTemplate) {
      let matchedTemplate = this.dropdownOptions['allTemplates']?.find(item =>
        (this.dropdownOptions['cloneTemplateId'] == item.id));
      if(matchedTemplate) {
        delete this.templateDetails?.id;
        delete this.templateDetails?.parent_template;
      }
    }
    const payload = {
      ...(this.templateDetails || {}),
      eventId: +eventId,
      eventCode,
      // TEMP change
      refId:programId,
      // refId: undefined,
      notificationConfig: {
        ...(this.templateDetails.notificationConfig || {}),
        emailConfig: {
          // header: header ? this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(header): null,
          body: body ? this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(body): null,
          // footer: footer ? this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(footer): null,
        },
        urlsFormData: template.recipient?.urlformData
      },
      emailTemplate: {
        ...(template?.emailTemplate || {}),
        body: bodyTemplate?.getInnerHtml() || '',
        header: '',
        footer: '',
        suffix: suffix,
        prefix: prefix
      },
      recipient: {
        ...(template?.recipient || {}),
      },
      role: this.dropdownOptions['actor'],
      language: this.dropdownOptions['language'],
      roleRecipient: this.dropdownOptions['roleRecipient'],
      schema: {}
    }
    if(this.isRootTemplate){
      payload.refId = 'simplifyvms';
      delete payload.entityId;
    }
    if (this.isRootLevelTemplete === true) {
      this.notificationConfigService.post(`/template/save-as-root-template`, payload).subscribe((response: any) => {
        this._alert.success('Template saved successfully');
        this.getTemplateById();
        this.loader.hide();
      },
        err => {
          this._alert.error(errorHandler(err));
          this.loader.hide();
        });
    } else {
      if(!this.hasEmailTemplate && payload.id) {
        delete payload.id
      }
      if(this.storageService.get("SYSTEM_DEFAULT") === true){
        payload.refId = "SYSTEM_DEFAULT";
      }
      // this.notificationConfigService[this.hasEmailTemplate ? 'put' : 'post'](`/template/`, payload).subscribe((response: any) => {
      this.notificationConfigService[this.hasEmailTemplate ? 'puts' : 'posts'](`/notification-config/template`, payload).subscribe((response: any) => {
        if (!this.hasEmailTemplate) {
          if (response?.payload) {
            this.assignTemplate(response?.payload[0]);
          }
        }
        this._alert.success('Template saved successfully');
        this.getTemplateById();
        this.getField(payload?.eventCode)
      this.loader.hide();
      },
        err => {
          this._alert.error(errorHandler(err));
          this.loader.hide();
        });


    }
  }
  checkValidationOfBodyAndSubject(bodyTemplate){
    if (!bodyTemplate?.config || !this.templateDetails?.notificationConfig?.emailConfig?.body) {
      this._alert.warn('Please create body content for this template');
      return;
    }

    if(this.isEmpty(this.templateDetails.emailTemplate.subject)) {
      this._alert.warn('Please write a subject for this template');
      return
    }
  }

  // TEMP CHANGES
  newRoleName = '';
  templates = [
    {
      role: 'Hiring manager',
      id: 1
    },
    {
      role: 'Candidate',
      id: 2
    }
  ];

  seletedTemplate = this.templates[0];
  templateSeleted(template) {
    this.seletedTemplate = template;
  }

  isEmpty(str) {
    return (!str || /^\s*$/.test(str));
  }

  onLoadData(event, id){
    if(id === "header") this.headerData = event;
    if(id === "footer") this.footerData = event;
  }
  onChecked(event){
    this.isChecked = event;
    if(this.templateDetails.notificationConfig.include_header)  this.templateDetails.notificationConfig.emailConfig.header = this.headerData;
    if(this.templateDetails.notificationConfig.include_footer)  this.templateDetails.notificationConfig.emailConfig.footer = this.footerData;
  }
  addTemplate() {

    // validation non empty string and can not have existing role name
    if(!this.newRoleName) {
      return;
    }
    if(this.templates.find(t => t.role === this.newRoleName)) {
      return;
    }
    const template = {
      role: this.newRoleName,
      id: 3
    };
    this.seletedTemplate = template;
    this.templates.push(template);
    this.newRoleName = '';
  }

  templateDesignerClosed(event:any){
    if(!event) {
      this.templateDesignerConfig = null;
      return;
    }
    this.templateDetails.emailTemplate.additionalConfig = this.dynamicHtmlTemplateBuilderService.removeAllComponetRefProps(event.config);
    if (event.type === 'Body') {
      this.templateDetails.notificationConfig.emailConfig.body = {...event.config};
      // this.templateDetails.emailTemplate.body = event.config;


    }
    this.templateDesignerConfig = null;
  }
  onEditTemplate(val:string){
    this.templateDesignerConfig = {
      type: val,
      config : this.templateDetails?.notificationConfig?.emailConfig?.body ?? null
    }
  }
  markTemplateAsRoot(event:boolean){
    this.isRootTemplate=event;
  }
  deleteTemplate(event) {
    this.getTemplateById();
  }
  // goBack() {
  //   this.route.queryParams.subscribe((queryParams=>{
  //     if(queryParams['navigateToSelfConfig']){
  //        this.router.navigate(['self-configuration','notification', 'config', 'list']);
  //     }
  //     else{
  //       this.router.navigate(['notification', 'config', 'list']);
  //     }
  //   }))
  // }

    goBack(){
      this.location.back()
    }
}
