import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { ExpenseService } from 'src/app/expense/expense.service';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import { VendorService } from 'src/app/program-setup/vendor/vendor.service';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { errorHandler } from '../../../shared/util/error-handler';
@Component({
  selector: 'app-new-compliance-restiction-rule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new-compliance-restiction-rule.component.html',
  styleUrls: ['./new-compliance-restiction-rule.component.scss']
})
export class NewComplianceRestictionRuleComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public complianceRuleForm: UntypedFormGroup;
  @Input() isCreateComplianceRule = 'hidden';
  @Output() onClose = new EventEmitter();
  public toggle = {
    title: 'active',
    value: true
  }
  tabIndex = 0;
  isViewMode: boolean = false;
  isViewId: any ;
  isUpdateReq: boolean = false;
  toUPdateIteamId: any;
  public title: any = 'Add New Compliance Restriction Rule';
  rendererData: any;
  public selectVendor: any;
  public duration: any = [];
  public isEditMode: boolean = false;
  public vendorData: any = {};
  statusData = ["PENDING","COMPLIANT","NON-COMPLIANT","NOT-APPLICABLE"];
  public months = [
    {value: 1, name: "January"},
    {value: 2, name: "February"},
    {value: 3, name:  "March"},
    {value: 4, name:  "April"},
    {value: 5, name: "May"},
    {value: 6, name:"June"},
    {value: 7, name:"July"},
    {value: 8, name: "August"},
    {value: 9, name: "September"},
    {value: 10, name: "October"},
    {value: 11, name: "November"},
    {value: 12, name: "December"}
  ];
  public years = [2021,2022,2023,2024,2025,2026,2027,2028,2029,2030];
  public calendarOptions: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [
    ]
  };
  dateFormat = DATE_FORMAT.FORMATDDMMYY;
  start_date = null;
  end_date = null;
  currentProgram:any;
  public monthYearCheck: any;
  vendorSearch$ = new Subject<string>();
  vendorLoading = false;
  constructor(private fb: UntypedFormBuilder,
    private _vendorService: VendorService,
    private _storageService: StorageService,
    private eventStream: EventStreamService,
    public router: Router,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private expenseService: ExpenseService,
    private localDatePipe: LocalDateFormatPipe) { }

  ngOnInit(): void {
     this.currentProgram = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    this.monthYearCheck = this.currentProgram?.config?.compliance;
    if (this.currentProgram) {
      this.dateFormat = this.expenseService.getDefaultDateFormat();
    }
    // if(this.monthYearCheck?.is_allow){
    //   if(this.monthYearCheck?.options?.month){
    //     this.complianceRuleForm.controls["month"].setValidators(Validators.required);
    //     this.complianceRuleForm.controls["month"].updateValueAndValidity();
    //   }else{
    //     this.complianceRuleForm.controls["month"].clearValidators();
    //     this.complianceRuleForm.controls["month"].updateValueAndValidity();
    //   }
    //   if(this.monthYearCheck?.options?.year){
    //     this.complianceRuleForm.controls["year"].setValidators(Validators.required);
    //     this.complianceRuleForm.controls["year"].updateValueAndValidity();
    //   }else{
    //     this.complianceRuleForm.controls["year"].setValidators(Validators.required);
    //     this.complianceRuleForm.controls["year"].updateValueAndValidity();
    //   }
    // }
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate());
    this.calendarOptions = {
      language: 'English',
      range: false,
      enabledDateRanges: [{ start: date }
      ]
    };
    this.complianceRuleForm = this.fb.group({
      name: ['', Validators.required],
      month: [null],
      year: [null],
      vendor:[[]],
      status:[null, Validators.required],
      is_enabled: [true]
    });
    this.duration = [{ name: 'Hour(s)', value: 'H', bValue: 'HOURS' }, { name: 'Day(s) ', value: 'D', bValue: 'DAYS' }, { name: 'Week(s)', value: 'W', bValue: 'WEEKS' }];
    this.getVendorList();
    this.subscriptions.push(this.eventStream.on(Events.CREATE_COMPLIANCE_RULE).subscribe((data: any) => {
      this.activatedRoute.queryParams.subscribe(param => {
        this.title = `Add New Compliance Restriction Rule`;
      });
      this.complianceRuleForm = this.fb.group({
      name: ['', Validators.required],
      month: [null],
      year: [null],
      vendor:[[]],
      status:[null, Validators.required],
      is_enabled: [true]
      });
      this.getVendorList();
      this.start_date = null;
      this.end_date = null;
      if (data) {
        this.isCreateComplianceRule = 'visible';
      } else {
        this.isCreateComplianceRule = 'hidden';
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.EDIT_COMPLIANCE_RULE).subscribe((data) => {
      let c= this;
      if (data.event) {
        this.title = `Edit Compliance Restiction Rule`;
        // this.title = `Edit (${data.data.name})`;
        this.toggle.value = data.data.is_enabled;
        this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
        this.isCreateComplianceRule = 'visible';
        let complianceData = data.data;
        this.isUpdateReq = true;
        this.isEditMode = false;
        this.toUPdateIteamId = data.data.id;
        c.assignComplianceRuleData(complianceData)
      }
    }));

    this.subscriptions.push(this.eventStream.on(Events.VIEW_COMPLIANCE_RULE).subscribe((data: any) => {
      if (data.event) {
        this.toggle.title = data.data.is_enabled == true ? 'active' : 'inactive';
        this.toggle.value = data.data.is_enabled;
        this.title = `Compliance Rule Detail View`;
        // this.title = `${data.data.name} detail view`;
        this.isEditMode = false;
        this.isViewMode = true;
        let complianceData = data?.data;
        this.isViewId = data?.data?.id
        this.assignComplianceRuleData(complianceData);
        this.isCreateComplianceRule = 'visible';
      } else {
        this.isCreateComplianceRule = 'hidden';
      }
    }));

    this.vendorSearch$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      tap(_ => {
        this.vendorData = [];
        this.vendorLoading = true;
      }),
      switchMap(searchTerm => {
          return this._vendorService.get(`/configurator/programs/${this.currentProgram?.id}/vendors?k=${searchTerm}`).pipe(
            map((res:any) => res?.program_vendors)
          );
      })
    ).subscribe({next:(values:any) => {
      this.vendorData = values;
      this.vendorLoading = false;
    }, error: (err) => {
    }})
  }

  searchVendor(search: { term: string, items: Array<string>}) {
    this.vendorSearch$.next(search?.term);
  }

  getVendorList() {
    const programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    const programId = programDetails['program_req_id'];
    this.subscriptions.push(this._vendorService.get(`/configurator/programs/${programId}/vendors`).subscribe({
      next: (data: any) => {
        if (data) {
          this.vendorData = data.program_vendors;
        }
      },
      error: error => {
        this.alertService.error(errorHandler(error));
      }
    }));
  }

  private assignComplianceRuleData(data) {
    this.complianceRuleForm.patchValue(data);
    this.complianceRuleForm.get('status').patchValue(data?.status?.status_list);
    this.start_date = this.localDatePipe.transform(data?.start_date, this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATDDMMYY);
    this.end_date = this.localDatePipe.transform(data?.end_date, this.dateFormat ,null ,null , true, DATE_FORMAT.FORMATDDMMYY);
  }


  editRule() {
     this.toUPdateIteamId  = this.isViewId;
     this.isUpdateReq = true;
     this.isEditMode = false;
     this.isViewMode = false;
  }


  onClickToggle() {
    if (this.toggle.value) {
      this.toggle.value = false;
      this.toggle.title = 'inactive';
    } else {
      this.toggle.value = true;
      this.toggle.title = 'active';
    }
  }
  goToNext() {
    this.onIndexChange(this.tabIndex + 1);
  }
  onIndexChange(event) {
    this.tabIndex = event;
  }

  createRule() {
    if (this.complianceRuleForm.invalid) {
      this.alertService.error(`Please fill the required fields.`);
      return;
    }
    let programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    let programId = programDetails['program_req_id'];
    const complianceFormData = this.complianceRuleForm.value;
    var payLoad = {
    "name": complianceFormData?.name,
    "start_date": this.localDatePipe.transform(this.start_date, DATE_FORMAT.FORMATDDMMYY ,null ,null , true, this.dateFormat),
    "end_date": this.localDatePipe.transform(this.end_date, DATE_FORMAT.FORMATDDMMYY ,null ,null , true, this.dateFormat),
    "vendor": complianceFormData?.vendor,
    "status": {
        "status_list": complianceFormData?.status
    },
    "is_enabled": true
    }

    if(this.monthYearCheck?.is_allow){
      if(this.monthYearCheck?.options?.month){
        payLoad['month'] = complianceFormData.month;
      }
      if(this.monthYearCheck?.options?.year){
        payLoad['year'] = complianceFormData.year;
      }
    }

       if (this.isUpdateReq) {
        this.subscriptions.push(this._vendorService.put(`/configurator/programs/${programId}/vendor-compliance/vendor-compliance-rule/${this.toUPdateIteamId}`, payLoad).subscribe(
          data => {
            if (data) {
              this.isUpdateReq = false;
              this.isViewMode = false;
              this.sidebarClose();
              this.alertService.success(`Compliance Rule Updated successfully.`);
              this.eventStream.emit(new EmitEvent(Events.EDIT_COMPLIANCE_RULE, false));
            }
          },
          (err) => {
            this.alertService.error(errorHandler(err));
          }
        ));
      }else{
        this.subscriptions.push(this._vendorService.post(`/configurator/programs/${programId}/vendor-compliance/vendor-compliance-rule`, payLoad).subscribe(
          data => {
            if (data) {
              this.alertService.success(`Compliance Rule Added successfully.`);
              this.complianceRuleForm.reset();
              this.sidebarClose();
              this.eventStream.emit(new EmitEvent(Events.CREATE_COMPLIANCE_RULE, false));
            }
          },
          (err) => {
            this.alertService.error(errorHandler(err));
          }));
      }
  }

  sidebarClose() {
    this.vendorData = {};
    this.eventStream.emit(new EmitEvent(Events.CREATE_VENDOR_SCHEDULE, false));
    this.complianceRuleForm.reset();
    this.toggle.value = true;
    this.tabIndex = 0;
    this.title = '';
    this.isViewMode = false;
    this.isUpdateReq = false;
    this.toggle.title = 'active';
    this.isCreateComplianceRule = 'hidden';
    this.onClose.emit(true);
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
