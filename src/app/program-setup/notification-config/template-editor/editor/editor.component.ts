import {Component, OnInit, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges} from '@angular/core';
import {UntypedFormArray, UntypedFormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {StorageKeys, StorageService} from 'src/app/core/services/storage.service';
import {Log, LOG_TYPE} from 'src/app/library/logs/logs.model';
import {NotificationConfigService} from '../../notification-config.service';
import { UsersType } from 'src/app/shared/enums';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { GlobalConstants } from 'src/app/shared/globalconstants';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit, OnChanges {
  @Input() editorType;
  @Input() notificationData;
  @Input()  isRootLevelTemplete: boolean;
  @Output() onedit = new EventEmitter();
  @Input() templateDetails = {
    emailTemplate: {
      header: '',
      body: '',
      footer: '',
      subject: '',
    },
    recipient: {
      keys: [],
      roles: [],
      customEmails: '',
      excludeEmails: '',
    },
    schema: [],
    notificationConfig: {
      include_header: true,
      include_footer: true,
      active: true,
      urls: [],
      urlsFormData: {
        url: []
      }
    },
    id: null
  };
  public isTemplatePresent: string;
  programId: any;
  eventData: any;
  @Input() set hasEmailTemplate(value: string) {
    this.isTemplatePresent = value;
  }
  @Output() checked = new EventEmitter();
  @Output() templateSaveClicked = new EventEmitter();
  showOption = false;
  recipients = false;
  schema = false;
  urls = false;
  logs: Log = undefined;
  templateKeys: any = undefined;
  disableSave = false;
  schemaTypes: any = [{name: 'String', type: 'string'}, {name: 'Dropdown', type: 'dropdown'}];
  emailHeaderExpanded = true;
  emailBodyExpanded = true;
  emailFooterExpanded = true;
  footerParagraph = true;
  footerSocialLinks = false;
  footerLinks = false;
  footerUnsubscribe = false;
  currentPrgram;
  roles;
  urlsForm: any;
  urlFormValue: any;
  @Input() toolType;
  @Output() propertyName;
  @Output() markeAsRootTemplate=new EventEmitter();
  @Output() deleteTemplate = new EventEmitter();
  isSuperAdmin = false;
  sampleUrlFormData = {
    url: [
      {
        endpoint: '',
        parameters: [
          {
            queryParam: '',
            queryType: '',
            queryValue: ''
          },
          {
            queryParam: '',
            queryType: '',
            queryValue: ''
          }
        ]
      },
      {
        endpoint: '',
        parameters: [
          {
            queryParam: '',
            queryType: '',
            queryValue: ''
          }
        ]
      }
    ]
  };
  isOpenItemProperties = false;
  allowOnlyRootLevel: boolean = false;
  rolesAllowed: boolean = false;
  isSubjectDynamic: boolean= false;
  constructor(
    private notificationConfigService: NotificationConfigService,
    private storageService: StorageService,
    private _alert: AlertService,
    private loader: LoaderService,
    private formBuilder: UntypedFormBuilder) {
  }

  toggleOption() {
    this.showOption = true;
  }

  hideOption() {
    this.showOption = false;
  }

  onCheckboxChange(event){
    this.checked.emit(event.target.checked);
  }
  
  ngOnChanges(changes: SimpleChanges) {
    const subject= changes?.templateDetails?.currentValue?.emailTemplate?.subject ;
    if( subject?.startsWith(GlobalConstants.NOTIFICATION.DYNAMIC_SUBJECT)){
        this.isSubjectDynamic= true;
        this.templateDetails.emailTemplate.subject= this.templateDetails.emailTemplate.subject?.replace(GlobalConstants.NOTIFICATION.DYNAMIC_SUBJECT, "");
        console.log(" Subject is updated  ", this.templateDetails?.emailTemplate?.subject)
    }
    if (this.templateDetails?.notificationConfig?.urlsFormData?.url) {
      while (this.templateDetails?.notificationConfig?.urlsFormData?.url?.length > this.urlsForm?.value?.url?.length) {
        this.onClickAddurl();
      }
      this.templateDetails?.notificationConfig?.urlsFormData?.url?.forEach((url,ind) => {
        while(url?.parameters.length > this.urlsForm?.value?.url[ind]?.parameters.length){
          this.onClickAddParameters(ind);
        }
      })
      this.templateDetails?.notificationConfig?.urlsFormData?.url?.forEach((val, index) => {
        this.urlsForm?.get('url')?.controls[index]?.get('endpoint')?.patchValue(val?.endpoint);
        this.urlsForm?.get('url')?.controls[index]?.get('parameters')?.controls?.forEach((item, ind) => {
          item?.get('queryParam')?.patchValue(val?.parameters[ind]?.queryParam);
          item?.get('queryType')?.patchValue(val?.parameters[ind]?.queryType);
          item?.get('queryValue')?.patchValue(val?.parameters[ind]?.queryValue);
        })
      })
    }
  }

  ngOnInit(): void {
    this.currentPrgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.programId = this.currentPrgram?.id;
    const user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    if(user_type === UsersType.Super_org.toLowerCase()){
      this.isSuperAdmin = true;
    }
    this.eventData = JSON.parse(localStorage.getItem('eventData'));
    this.allowOnlyRootLevel = this.eventData?.allowOnlyRootLevelTemplates === true || false;
    this.rolesAllowed = this.eventData?.rolesAllowed === true || false;
    this.getTemplateKeys();
    this.loadRolesByProgram();
    this.createUrlsForm();
    this.updateUrlsForm();
  }

  ngAfterViewChecked() {
    setTimeout(() => {
      if(this.allowOnlyRootLevel) {
        this.isRootLevelTemplete = true;
        this.markeAsRootTemplate.emit(true);
      }
    }, 100);
  }

  updateUrlsForm() {
    for (let i = 1; i < this.sampleUrlFormData.url.length; i++) {
      this.onClickAddurl();
      const parametersData = this.sampleUrlFormData.url[i].parameters;
      for (let j = 0; j < parametersData.length; j++) {
        this.onClickAddParameters(i - 1);
        this.selectQueryType(parametersData[j].queryType, i, j);
      }
    }
    this.urlsForm.patchValue(this.sampleUrlFormData);
  }

  getTemplateKeys() {
    const eventData = JSON.parse(localStorage.getItem('eventData'));
    if(eventData){
      this.notificationConfigService.getTemplateKeys(eventData.eventCode, true).subscribe((response: any) => {
        this.templateKeys = response?.template_fields_mappings;
      });
    }
  }

  loadRolesByProgram() {
    this.notificationConfigService.getRoles(`/configurator/programs/${this.currentPrgram.id}/roles?limit=10000`).subscribe((response: any) => {
      this.roles = response?.roles;
    });
  }

  showRecipients() {
    this.recipients = !this.recipients;
  }

  showSchema() {
    this.schema = !this.schema;
  }

  showUrls() {
    this.urls = !this.urls;
  }

  emailContentChanged(event) {
    this.templateDetails.emailTemplate.body = event;
  }

  checkForNewSchemaAdded(event) {
    if (event?.which == 221) { // 221 => }
      this.logs = undefined;
      const matchedContent = this.templateDetails.emailTemplate.body?.match(/{\w*}/g);
      if (matchedContent && matchedContent?.length > 0) {
        const key = matchedContent[matchedContent?.length - 1]?.replace('{', '')?.replace('}', '');
        const isKeyPresent = this.templateDetails.schema?.some(schema => schema.name === key);
        if (!isKeyPresent) {
          const isKeyPresentInDB = this.templateKeys?.some(templateKey => templateKey.key === key);
          if (isKeyPresentInDB) {
            if (!this.templateDetails?.schema) {
              this.templateDetails.schema = [];
            }
            this.templateDetails.schema.push({name: key, type: 'string'});
          } else {
            this.disableSave = true;
            this.logs = {type: LOG_TYPE.ERROR, heading: `{key} Key doesnt exists`, autoClose: true, isShown: true};

          }
        }
      }
    }
  }

  checkForNewSchemasAdded(event) {
    this.logs = undefined;
    this.disableSave = false;
    this.templateDetails.schema = [];
    let matchedContent:any = this.templateDetails.emailTemplate.body?.match(/{\w*}/g);
    matchedContent = [...new Set(matchedContent)];
    if (matchedContent && matchedContent?.length > 0) {
      matchedContent?.forEach(content => {
        const key = content?.replace('{', '')?.replace('}', '');
        const isKeyPresent = this.templateDetails.schema?.some(schema => schema.name === key);
        if (!isKeyPresent) {
          const isKeyPresentInDB = this.templateKeys?.some(templateKey => templateKey.key === key);
          if (isKeyPresentInDB) {
            if (!this.templateDetails?.schema) {
              this.templateDetails.schema = [];
            }
            this.templateDetails.schema.push({name: key, type: 'string'});
          } else {
            this.disableSave = true;
            this.logs = {type: LOG_TYPE.ERROR, heading: `{${key}} Key doesnt exists`, autoClose: true, isShown: true};
          }
        }
      });
    }
    console.log();
  }

  checkEmailsValid(emailList: string[]): boolean {
    let hasInvalidEmail = false;
    for(const email of emailList) {
      if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
        hasInvalidEmail = true;
        break;
      }
    }
     return hasInvalidEmail;
  }

  saveTemplate() {
    this.saveUrlForm();
    console.log(this.templateDetails);
    const {customEmails, keys, roles, excludeEmails}: any = this.templateDetails.recipient || {};
    let templateRoles = [];
    if (this.templateDetails.recipient?.roles?.length) {
      templateRoles = roles.map(roleId => this.roles?.find(r => r.id === roleId))?.filter(role => role?.id)?.map(role => ({
        id: role.id,
        name: role.name,
      }));
    }
    const allCustomEmails = customEmails ? Array.isArray(customEmails) ? customEmails : customEmails?.split(',').filter(email => email).map(email => email && email.trim()) : [];
    const allExcludeEmails = excludeEmails ? Array.isArray(excludeEmails) ? excludeEmails : excludeEmails?.split(',').filter(email => email).map(email => email && email.trim()) : [];
    if (allCustomEmails?.length) {
      if(this.checkEmailsValid(allCustomEmails)) {
        this._alert.error('Custom Emails has invalid email');
        return;
      }
    }
    if (allExcludeEmails?.length) {
      if(this.checkEmailsValid(allExcludeEmails)) {
        this._alert.error('Exclude Emails has invalid email');
        return;
      }
    }
    console.log(this.templateDetails);
    this.templateSaveClicked.emit({
      emailTemplate: {
        subject: this.isSubjectDynamic? GlobalConstants.NOTIFICATION.DYNAMIC_SUBJECT + this.templateDetails.emailTemplate.subject : this.templateDetails.emailTemplate.subject,
      },
      recipient: {
        customEmails: allCustomEmails,
        excludeEmails: allExcludeEmails,
        keys: keys || [],
        roles: templateRoles,
        urlformData: this.urlsForm.value,
      }
    });
  }

  keySelected(value) {
    navigator.clipboard.writeText(`{{${value}}}`).then().catch(e => console.error(e));
  }

  createUrlsForm() {
    this.urlsForm = this.formBuilder.group({
      url: this.formBuilder.array([this.addNewUrl()])
    });
  }

  get urlArray(): UntypedFormArray {
    return this.urlsForm?.get('url') as UntypedFormArray;
  }

  onClickAddurl() {
    this.urlArray.push(this.addNewUrl());
  }

  onClickDeleteUrl(index: number) {
    this.urlsForm?.get('url')?.removeAt(index);
  }

  addNewUrl() {
    return this.formBuilder.group({
      endpoint: ['', [Validators.required]],
      parameters: new UntypedFormArray([this.addNewParameters()])
    });
  }

  parametersArray(index: number) {
    return this.urlsForm?.get('url')?.controls[index]?.get('parameters').controls;
  }

  onClickAddParameters(index: number) {
    const form = this.urlsForm?.get('url')?.controls[index]?.get('parameters');
    form.push(this.addNewParameters());
  }

  onClickDeleteParameters(index: number, parameterIndex: number) {
    this.urlsForm?.get('url')?.controls[index]?.get('parameters')?.removeAt(parameterIndex);
  }

  addNewParameters() {
    return this.formBuilder.group({
      queryParam: ['', [Validators.required]],
      queryType: ['Static', [Validators.required]],
      queryValue: ['']
    });
  }

  selectQueryType(eve: any, rootIndex: number, subIndex: number) {
    this.urlsForm?.get('url')?.controls[rootIndex]?.get('parameters')?.controls[subIndex]?.get('queryValue')?.setValue(null);
  }

  saveUrlForm() {
    const endpoints = this.urlsForm?.get('url').controls;
    this.urlFormValue = [];
    for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex++) {
      const subArray = [];
      const queryParameter = this.urlsForm?.get('url')?.controls[endpointIndex]?.get('parameters')?.controls;
      for (let paramIndex = 0; paramIndex < queryParameter.length; paramIndex++) {
        if (!queryParameter[paramIndex].controls?.queryParam?.value) {
          continue;
        }
        subArray.push({
          queryParam: queryParameter[paramIndex].controls?.queryParam?.value,
          queryType: queryParameter[paramIndex].controls?.queryType?.value,
          queryValue: queryParameter[paramIndex].controls?.queryValue?.value
        });
      }
      this.urlFormValue.push({
        endpoint: endpoints[endpointIndex].controls?.endpoint?.value,
        queryParams: subArray
      });
    }
    console.log(this.urlFormValue);
  }

  toolSelectedEvent(tool) {
    this.propertyName = tool.title;
    this.isOpenItemProperties = true;
  }

  onCloseItemProperties(e) {
    this.isOpenItemProperties = e;
  }
  openPopUp(){
   this.onedit.emit('Body')
  }
  markAsRootTemplate(event){
    this.markeAsRootTemplate.emit(event.target.checked);
  }

  onClickToggleSatus() {
    if (this.templateDetails?.notificationConfig?.active) {
      this.templateDetails.notificationConfig.active = false;
    }
    else {
      this.templateDetails.notificationConfig.active = true;
    }
  }
  onTemplateDelete() {
    if (!this.templateDetails?.id) {
      return;
    }
    this.loader.show();
    // this.notificationConfigService.delete(`/template/${this.templateDetails?.id}`).subscribe({
    this.notificationConfigService.delete(`/notification-config/template/${this.templateDetails?.id}`).subscribe({
      next: (res) => {
        this._alert.success('Template deleted successfully');
        this.deleteTemplate.emit(true);
        this.loader.hide();
      },
      error: err => {
        this._alert.error(errorHandler(err));
        this.loader.hide();
      }
    });
  }
}

