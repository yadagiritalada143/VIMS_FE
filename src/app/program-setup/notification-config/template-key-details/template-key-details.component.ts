import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { NotificationConfigService } from '../notification-config.service';

@Component({
  selector: 'app-template-key-details',
  templateUrl: './template-key-details.component.html',
  styleUrls: ['./template-key-details.component.scss']
})
export class TemplateKeyDetailsComponent implements OnInit {

  templateKeyObj: any = {};
  eventData: any;
  templateKeyId: any;
  templateKeyForm: UntypedFormGroup = this.fb.group({
    field_name: [null, Validators.required],
    field_slug: [null, Validators.required],
    module: [null, Validators.required],
    module_slug: [{value: null, disabled: true}, Validators.required],
    is_recipient: [false],
    is_enabled: [true]
  });

  constructor(

    private fb: UntypedFormBuilder,
    private activatedRoute: ActivatedRoute,
    private notificationConfigService: NotificationConfigService,
    private loader: LoaderService,
    private alert: AlertService,
    private router: SvmsRouterService
  ) { }

  ngOnInit(): void {
    this.eventData = JSON.parse(localStorage.getItem('eventData'));
    this.templateKeyId = this.activatedRoute.snapshot.params.id;
    if(this.templateKeyId) {
      this.getTemplateKeyById();
    } else {
      this.templateKeyForm.patchValue({
        module: this.eventData?.module,
        module_slug: this.eventData?.eventCode
      })
    }
  }

  getTemplateKeyById() {
    this.loader.show();
    this.notificationConfigService.getConfigNotification(`/notification-config/template-fields/${this.templateKeyId}`).subscribe((response: any) => {
      this.loader.hide();
      if (response && response?.template_fields_mapping) {
        this.templateKeyObj = response.template_fields_mapping;
        if (this.templateKeyObj) {
          this.templateKeyForm.patchValue({
            field_name: this.templateKeyObj.field_name,
            field_slug: this.templateKeyObj.field_slug,
            module: this.eventData.module,
            module_slug: this.eventData.eventCode,
            is_recipient: this.templateKeyObj.is_recipient || false,
            is_enabled: this.templateKeyObj.is_enabled || true
          })
        }
      }
    },
      err => {
        this.loader.hide();
       });
  }

  saveTemplateKey() {
    const payload = this.templateKeyForm.getRawValue();
    this.loader.show();
    if(this.templateKeyId) {
      this.notificationConfigService.updateConfigNotification
      (`/notification-config/template-fields/${this.templateKeyId}`, payload).subscribe((response: any)=>{
        this.alert.success('Template Key updated successfully');
        this.loader.hide();
        this.backTemplateKey();
      }, err => {
        this.loader.hide();
      });
    } else {
      this.notificationConfigService.createConfigNotification(`/notification-config/template-fields` , payload).subscribe((response: any)=>{
        this.alert.success('Template Key submitted successfully');
        this.loader.hide();
        this.backTemplateKey();
      }, err => {
        this.loader.hide();
      });
    }
  }

  backTemplateKey() {
    this.activatedRoute.queryParams.subscribe((queryParams=>{
        this.router.navigate(['notification', 'config', 'event', 'templatekeys', this.eventData?.id],
        queryParams['navigateToSelfConfig'] ? {
          queryParams:{
            navigateToSelfConfig: true
          },
        }: {});
    }))
  }

  toggleIsEnableValue() {
    this.templateKeyForm.get('is_enabled').setValue(!this.templateKeyForm.get('is_enabled').value);
  }

}
