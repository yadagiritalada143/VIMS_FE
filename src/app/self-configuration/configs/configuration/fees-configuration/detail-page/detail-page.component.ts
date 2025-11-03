import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { EmitEvent,Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { StorageService,StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Subscription, Subject } from 'rxjs';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { ActivatedRoute } from '@angular/router';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';

@Component({
  selector: 'app-detail-page',
  templateUrl: './detail-page.component.html',
  styleUrls: ['./detail-page.component.scss']
})
export class DetailPageComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  private editId: String = '';
  public labor_categories = [];
  public vendors = [];
  details : any = [];

  private hierarchySub: Subject <string> = new Subject <string> ();
  public hierarchyTree: Array <any> = [];
  public programId: string;
  FeesDetail: any = {};
  toggles:any = {
    msp_partner:{
      value: false,
      mspFees:[
        {
          label: 'Timesheet',
          value: 'timesheet',
          isSelected: false
        },
        {
          label: 'Expense',
          value: 'expense',
          isSelected: false
        },
        {
          label: 'Misc Expense',
          value: 'Miscexpense',
          isSelected: false
        },
        {
          label: 'SOW Project',
          value: 'SOWProject',
          isSelected: false
        }
      ],
    },
    vms:{value: false,
    vmsFees:[
      {
        label: 'Timesheet',
        value: 'timesheet',
        isSelected: false
      },
      {
        label: 'Expense',
        value: 'expense',
        isSelected: false
      },
      {
        label: 'Misc Expense',
        value: 'Miscexpense',
        isSelected: false
      },
      {
        label: 'SOW Project',
        value: 'SOWProject',
        isSelected: false
      }
    ], },
    penalty:{
    value: false,
    penaltyFees:[
      {
        label: 'Timesheet',
        value: 'timesheet',
        isSelected: false
      }
    ]}
  }

  constructor(private programService: ProgramService,
    private storageService: StorageService,
    private _alertService: AlertService,
    private loader: LoaderService,
    private eventStream: EventStreamService,
    private router: SvmsRouterService,
    private localDateFormat: LocalDateFormatPipe,
    public activatedRoute: ActivatedRoute,
    public commonView: CommonViewRuleFlowService
    ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.activatedRoute.queryParams.subscribe(({ id }) => {
      setTimeout(()=>{
        this.editId = id;
        this.getDetailsById(id);
      },700);
    });
    this.subscriptions.push(
      this.hierarchySub
      .pipe(
        distinctUntilChanged((x: string, y: string) => (x === y)),
        debounceTime(600),
        switchMap((programId: string) => {
          const url = `/configurator/programs/${programId || this.programId}/hierarchy`;
          return this.programService.get(url);
        })
      ).subscribe({
        next: (data: any) => {
          if(data && data.result) {
            this.hierarchyTree = data.result;
          }
        },
        error: err => {
          this._alertService.error(errorHandler(err));
        }
      })
    );
    this.hierarchySub.next(this.programId);
    this.getLaborCategoriesList();
    this.getVendorList();
  }
  getDetailsById(id) {
    const url = `/configurator/programs/${this.programId}/msps/fees/${id}`;
    this.loader.show();
    this.programService.get(url)
      .subscribe({
        next: (res: any) => {
          this.loader.hide();
          this.FeesDetail = res;
          this.FeesDetail.msp_fee.sourcing_models = this.processSourcingModel(this.FeesDetail?.msp_fee?.sourcing_models);
          this.FeesDetail.msp_fee.effective_date = this.localDateFormat.transform(this.FeesDetail?.msp_fee?.effective_date, '', '', '', true);
          this.details = [{
            label : "Fee Configuration Name",
            value : this.FeesDetail?.msp_fee?.title,
            displayType : 'text'
          },
          {
            label : "Status",
            value : this.FeesDetail?.msp_fee?.is_enabled ? 'Active' : 'Inactive',
            displayType : 'status',
            enabled : this.FeesDetail?.msp_fee?.is_enabled
          },
          {
            label : "Hierarchy",
            value : this.FeesDetail?.msp_fee?.hierarchy_levels,
            displayType : 'box-view'
          },
          {
            label : "Source Model",
            value : this.FeesDetail?.msp_fee?.sourcing_models.map(x => { return {name : x, id: x}}),
            displayType : 'box-view'
          },
          {
            label : "Labor Category",
            value : this.FeesDetail?.msp_fee?.industries,
            displayType : 'box-view'
          },
          {
            label : "Vendors",
            value : this.FeesDetail?.msp_fee?.vendors?.length ? this.FeesDetail?.msp_fee?.vendors : '--',
            displayType : this.FeesDetail?.msp_fee?.vendors?.length ? 'box-view': 'text'
          },
          {
            label : "Effective Date",
            value : this.FeesDetail.msp_fee.effective_date,
            displayType : 'text'
          }
        ];

          //  categorical_fees
          this.toggles.msp_partner.value = false;
          this.toggles.vms.value = false;
          this.toggles.penalty.value = false;
          let fee_type = res['msp_fee']['categorical_fees'];
          fee_type.forEach(element => {
            if (element.fee_category == 'VMS') {
              this.toggles.vms.value = true;
              this.toggles.vms.funded_by = element.funded_by;
              this.toggles.vms.feesType = element.fee_type == 'FIXED' ? 'fixed' : 'percentage';
              element.applicable_config.forEach(element1 => {
                if (element1.entity_ref == 'TIMESHEETS') {
                  this.toggles.vms.vms_timesheet_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[0].isSelected = false) : (this.toggles.vms.vmsFees[0].isSelected = true);
                }
                if (element1.entity_ref == 'EXPENSES') {
                  this.toggles.vms.vms_expense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[1].isSelected = false) : (this.toggles.vms.vmsFees[1].isSelected = true);
                }
                if (element1.entity_ref == 'MISC_EXPENSES') {
                  this.toggles.vms.vms_miscExpense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[2].isSelected = false) : (this.toggles.vms.vmsFees[2].isSelected = true);
                }
                if (element1.entity_ref == 'SOW_PROJECT') {
                  this.toggles.vms.vms_sow_project_fees = element1.fee;
                  element1.fee === null ? (this.toggles.vms.vmsFees[3].isSelected = false) : (this.toggles.vms.vmsFees[3].isSelected = true);
                }
              });
            }
            if (element.fee_category == 'MSP_PARTNER') {
              this.toggles.msp_partner.value = true;
              this.toggles.msp_partner.funded_by = element.funded_by;
              this.toggles.msp_partner.feesType = element.fee_type == 'FIXED' ? 'fixed' : 'percentage';
              element.applicable_config.forEach(element1 => {
                if (element1.entity_ref == 'TIMESHEETS') {
                  this.toggles.msp_partner.msp_partner_timesheet_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[0].isSelected = false) : (this.toggles.msp_partner.mspFees[0].isSelected = true);
                }
                if (element1.entity_ref == 'EXPENSES') {
                  this.toggles.msp_partner.msp_partner_expense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[1].isSelected = false) : (this.toggles.msp_partner.mspFees[1].isSelected = true);
                }
                if (element1.entity_ref == 'MISC_EXPENSES') {
                  this.toggles.msp_partner.msp_partner_miscExpense_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[2].isSelected = false) : (this.toggles.msp_partner.mspFees[2].isSelected = true);
                }
                if (element1.entity_ref == 'SOW_PROJECT') {
                  this.toggles.msp_partner.msp_partner_sow_project_fees = element1.fee;
                  element1.fee === null ? (this.toggles.msp_partner.mspFees[3].isSelected = false) : (this.toggles.msp_partner.mspFees[3].isSelected = true);
                }
              });
            }
            if (element.fee_category == 'MSP_PENALTY') {
              this.toggles.penalty.value = true;
              this.toggles.penalty.funded_by = element.funded_by;
              this.toggles.penalty.feesType = element.fee_type == 'FIXED' ? 'fixed' : 'percentage';
              element.applicable_config.forEach(element1 => {
                if (element1.entity_ref == 'TIMESHEETS') {
                  this.toggles.penalty.msp_penalty_timesheet_fees = element1.fee;
                  element1.fee === null
                    ? (this.toggles.penalty.penaltyFees[0].isSelected = false)
                    : (this.toggles.penalty.penaltyFees[0].isSelected = true);
                }
              });
            }
          });
        },
        error: err => {
          this.loader.hide();
          this._alertService.error(errorHandler(err));
        }
      }
      );
  }
  processSourcingModel(models) {
    let modelss:any = [];
    models?.forEach(m =>  {
      if(m){
      const result = m?.toLowerCase()?.toString()?.replace(/_/g, ' ');
       modelss.push(result);
      }
    });
    return modelss;
  }
  backClicked(){
    this.router.navigate(['configuration', 'fees-configuration', 'list']);
  }
  onEdit() {
    this.router.navigate(['configuration', 'fees-configuration', 'create'], { queryParams: { id:this.editId }}).then(()=> {
      setTimeout(()=> {
        this.eventStream.emit(new EmitEvent(Events.FEE_CONFIG_EDIT, this.editId));
      }, 800);
    });
  }
  getLaborCategoriesList() {
    this.programService.get(`/configurator/programs/${this.programId}/industries`).subscribe((data: any) => {
      this.labor_categories = data.industries;
    });
  }

  getVendorList(term: any = null) {
    let url = `/configurator/programs/${this.programId}/vendors`;
    if (term) {
      url += `?k=${term}`;
    }
    this.programService.get(url).subscribe((data: any) => {
      this.vendors = data.program_vendors.map(vd => vd.vendor);
    });
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }

  get created_on(): number {
    return Number.parseFloat(this.FeesDetail?.msp_fee?.created_on || 0) * 1000;
  }

  get modified_on(): number {
    return Number.parseFloat(this.FeesDetail?.msp_fee?.modified_on || 0) * 1000;
  }
}
