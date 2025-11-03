import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { CommonViewConfig, CommonViewDetail } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.component';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-view-labor-category',
  templateUrl: './view-labor-category.component.html',
  styleUrls: ['./view-labor-category.component.scss']
})
export class ViewLaborCategoryComponent implements OnInit {
  details : any = [];
  id: any;
  isAccessable: boolean = false;
  public viewConfig: Array <CommonViewDetail> = [];
  constructor(private route: SvmsRouterService,
    private activatedRoute: ActivatedRoute,
    public storageService: StorageService,
    private programService: ProgramService,
    private loader: LoaderService,
    private alertService: AlertService,
    private datePipe: LocalDateFormatPipe,
    private authService: AuthorizationService
    ) { }

  ngOnInit(): void {
   this.isAccessable =  this.authService.authorize('labor_category_manage')
    this.activatedRoute.queryParams.subscribe(params => {
      this.id = params['id'];
    });
    this.getLaborCategoryDetails();
  }

  back(){
    this.route.navigate(['data-management', 'labor-categories']);
  }
  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  getLaborCategoryDetails() {
    let url: string = `/configurator/programs/${this.programId}/industries/${this.id}`;
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.details = data?.industry_data;
        this.details['created_on'] = this.datePipe.transform(this.details['created_on'] *1000)
        this.initializeViewConfig()
        this.loader.hide();
      }, error: (err: any) => {
        console.error(err);
        this.loader.hide();
        this.alertService.error(errorHandler(err));
      }
    });
  }
  initializeViewConfig() {
    this.viewConfig = [{
      label: 'Name',
      value: this.details?.name || '--',
      displayType: CommonViewConfig.TEXT
    }, {
      label: 'Status',
      value: this.details?.is_enabled ? 'Active' : 'Inactive',
      displayType: CommonViewConfig.STATUS,
      enabled: this.details?.is_enabled || false
    }];
  }
  editLabor(){
    this.route.navigate(['data-management', 'labor-create'], { queryParams: { id: this.id }});
  }
}
