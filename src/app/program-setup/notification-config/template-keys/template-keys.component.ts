import { Component, OnInit } from '@angular/core';
import { AlertService } from '../../../core/components/alert/alert.service';
import { NotificationConfigService } from '../notification-config.service';
import { ActivatedRoute } from '@angular/router';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-template-keys',
  templateUrl: './template-keys.component.html',
  styleUrls: ['./template-keys.component.scss']
})
export class TemplateKeysComponent implements OnInit {
  templateKeys: any = [];
  navigateToSelfConfig: boolean = false;

    constructor(
    private notificationConfigService: NotificationConfigService,
    private router: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    private loader: LoaderService,
    public alert: AlertService,
    private location: Location,
    private confirmService: ConfirmationDialogService,
    ) { }

  ngOnInit(): void {
    this.loadTemplateKeys();
    this.activatedRoute.queryParams.subscribe(queryParams =>{
      this.navigateToSelfConfig=queryParams['navigateToSelfConfig'];
    })
  }

  loadTemplateKeys() {
    const eventData = JSON.parse(localStorage.getItem('eventData'));
    this.loader.show();
    this.notificationConfigService.getTemplateKeys(eventData?.eventCode, false).subscribe((response: any) => {
      this.loader.hide();
      if (response && response?.template_fields_mappings)
        this.templateKeys = response?.template_fields_mappings;
    },
    err => {
      this.loader.hide();
     });
  }

  createTemplateKeyDefinition() {
    this.router.navigate(['notification', 'config', 'event', 'templatekey'],
      this.navigateToSelfConfig ? {
        queryParams:{
          navigateToSelfConfig: true
        },
      }: {});

  }

  editTemplateKeyDefinition(event) {
    this.router.navigate(['notification', 'config', 'event', 'templatekey', event.id],
      this.navigateToSelfConfig ? {
        queryParams:{
          navigateToSelfConfig: true
        },
      }: {});
  }

  deleteTemplateKeyDefinition(event) {
    this.confirmService.confirm('', `Do you want to delete this record?`, 'Yes', 'No')
      .then((confirmed) => {
        if (confirmed) {
          this.loader.show();
          this.notificationConfigService?.deleteTemplateKeyDefinition(event?.id).subscribe((res) => {
            this.alert.success('TemplateKey deleted successfully');
            this.loadTemplateKeys();
            this.loader.hide();
          },
            err => {
              this.alert.error(errorHandler(err));
              this.loader.hide();
            });
        }
      });
  }

  // navigateback() {
  //     if(this.navigateToSelfConfig){
  //       this.router.navigate(['self-configuration','notification', 'config', 'list']);
  //     }
  //     else{
  //       this.router.navigate(['notification', 'config', 'list']);
  //     }
  // }

  navigateback(){
    this.location.back();
  }
}
