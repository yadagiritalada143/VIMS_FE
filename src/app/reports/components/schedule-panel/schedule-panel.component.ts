import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ICustomReportPayload } from '../../pages/reports-details/reports-details.interfaces';
import { JobDetailsService } from 'src/app/jobs/job-details/job-details.service';
import { ReportService } from '../../services/report.service';
import { schedulePanelForm, weeksOfMonth, daysOfWeek, startPageParams } from './schedule-panel-model';
import { ReportsDetailsService } from '../../pages/reports-details/reports-details.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { DATE_FORMAT } from 'src/app/library/date-format/date-format.model';
import moment from 'moment';

@Component({
  selector: 'svms-schedule-panel',
  templateUrl: './schedule-panel.component.html',
  styleUrls: ['./schedule-panel.component.scss'],
})
export class SchedulePanelComponent implements OnInit {
  @Input() viewOnly = false;
  @Input() edit = false;
  @Input() reportName: any;
  @Input() reportKey:any;
  userType: any;
  @Input() set setReport(report: any) {
    this.viewOnly = Boolean(report?.viewOnly);
    this.report = { ...report, run_schedular_as: 'OWN' } || {};  // hardcoded 'run_schedular_as' will be removed after BE update
    this.frequency = Array.isArray(this.report?.run_frequency)
      ? this.report?.run_frequency
      : this.report?.run_frequency?.split(' ');
    this.isScheduled = Boolean(Number(report?.is_schedule));
    if (report?.reciver_user?.length) {
      this.reportService.getMembers(null, report?.reciver_user?.join()).subscribe(({ members }:any) => {
        this.setMembers(members);
        this.initForm();
      });
    } else {
      this.initForm();
    }
  }
  @Output() closeView = new EventEmitter<any>();
  currentDate: string;
  report: any;
  editForm: UntypedFormGroup;
  daysForm: UntypedFormGroup;
  isScheduled = true;
  frequency: Array<string>;
  isFormDisable: boolean;
  timeZone = [];
  public dateFormat;
  emails = [];
  isValidEmail = true;
  allRoles = [];
  allMembers = [];
  reportNames = [];
  selectRows = schedulePanelForm;
  daysOfWeek = daysOfWeek;
  weeksOfMonth = weeksOfMonth;
  logs:Log=undefined;
  // private now = Date.now();
  private now = moment(new Date().toISOString().slice(0, 10));
  searchRecipient = new Subject<string>();
  options: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };

  options2: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };

  option3: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: false,
    enabledDateRanges: [{ start: this.now }],
  };

  daysList: number[] = Array.from({length: 31}, (_, i) => i + 1); 

  constructor(
    private reportService: ReportService,
    private reportDetailsService: ReportsDetailsService,
    private alertService: AlertService,
    private jobDetailsService: JobDetailsService,
    private storageService: StorageService,
    private datePipe: LocalDateFormatPipe,
  ) {  }

  ngOnInit() {

    this.userType = this.storageService.get(StorageKeys.USER_TYPE);
    if(this.userType == 'MSP' || this.userType == 'SUPER_ORG'){
      this.selectRows[4].label = `Users as recipients 
    ( report not meant for some roles will not be send to the users belonging to it )`
    }
    this.dateFormat = this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat;
    this.reportService.getScheduledReports(startPageParams).subscribe( // subscription for getting reports schedule names
      ({ data }) => {
        this.reportNames = data?.map(elem => elem.schedule_name);
      }
    );
    // this.currentDate = new Date().toISOString().slice(0, 10);
    this.currentDate = this.dateConvert(new Date());
    this.jobDetailsService.get(`/configurator/resources/time_zones`).subscribe(
      ({ time_zones }:any) => {
        this.timeZone = time_zones?.map(({ code, name }) => `${code} - ${name}`);
      }
    );

    this.initForm();
    // this.reportService.getRole().subscribe(
    //   ({ roles }) => {
    //     this.allRoles = roles;
    //     let rolesNames=[];
    //     roles?.forEach(function(element) {
    //         if(currentUserRole?.toLowerCase()==UserType.Super_org.toLowerCase()){
    //           if(element?.organization_category?.toLowerCase()!=='candidate'){
    //             rolesNames.push(element.name);
    //           }
    //         }else{
    //           if(element?.organization_category?.toLowerCase()==currentUserRole?.toLowerCase()){
    //             rolesNames.push(element.name);
    //           }
    //         }
    //     } );
    //     this.selectRows[4].options = rolesNames;
    // });

    this.selectRows[4].loading = true;
    this.reportService.getMembers().subscribe(({ members }:any) => {
      this.setMembers(members);
      this.selectRows[4].loading = false;
    });

    this.searchRecipient.pipe(map((v:any) => v.term), debounceTime(300), distinctUntilChanged(), tap(() => {
      this.selectRows[4].loading = true;
    }), switchMap((value:any) =>
      this.reportService.getMembers(value))).subscribe(({ members }:any) => {
        this.setMembers(members);
        this.selectRows[4].loading = false;
    });

      if(this.editForm){
    this.editForm?.controls['startDate']?.valueChanges?.subscribe(data => {
      if (data) {
        const startDate = this.getDate(this.datePipe.transform(moment(data, this.dateFormat || DATE_FORMAT?.FORMATMDY).toDate(), DATE_FORMAT?.FORMATMDY , null, null, true));
        this.options2 = {
          language: 'English',
          timepicker: true,
          format12h: true,
          range: false,
          enabledDateRanges: [{ start: startDate,  }],
        };

      }

    });
    this.editForm?.controls['endDate']?.valueChanges?.subscribe(data => {
      if (data) {
        let startDate: any = this.editForm.get('startDate').value;
        let endDate = new Date(this.datePipe.transform(data, this.dateFormat || DATE_FORMAT?.FORMATMDY, null, null, true));
        if (startDate && new Date(this.datePipe.transform(startDate, this.dateFormat || DATE_FORMAT?.FORMATMDY,null,null,true)).getTime() > endDate.getTime()) {
          this.showError('End Date should be greater then start date');
        } else {
        }
      }
    });
  }

  }

  initForm() {
    this.editForm = new UntypedFormGroup({
      rpt_run_day: new UntypedFormControl(this.report?.run_day || 'Weekly'),
      schedule_name: new UntypedFormControl(this.edit ? this.report?.schedule_name || this.reportName : '', [Validators.required]),
      subject: new UntypedFormControl(this.report?.subject, [Validators.required]),
      schedule_status: new UntypedFormControl(Boolean(Number(this.report?.is_schedule))),
      run_schedular_as: new UntypedFormControl(this.report?.run_schedular_as || null, [Validators.required]),
      reciver: new UntypedFormControl(this.report?.reciver?.map(item => this.allRoles.filter(el => el?.id === item)[0]?.name) || []),
      recipient: new UntypedFormControl(this.report?.reciver_user?.length ? this?.selectRows[4]?.options : []),
      run_time: new UntypedFormControl(this.report?.run_time || null, [Validators.required]),
      time_zone: new UntypedFormControl(this.report?.time_zone || null, [Validators.required]),
      startDate: new UntypedFormControl(this.dateConvert(this.report?.start_date) || this.dateConvert(this.currentDate), [Validators.required]),
      endDate: new UntypedFormControl(this.dateConvert(this.report?.end_date) || this.dateConvert(this.currentDate), [Validators.required]),
      noEndDate: new UntypedFormControl(Boolean(this.report?.no_end_date) || false),
      email: new UntypedFormControl([]),
      is_schedule_day: new UntypedFormControl(+this.report?.is_schedule_day || null),
    });
    this.emails = this.report?.reciver_email?.length
      ? this.report?.reciver_email.filter(email => !this.allMembers.some(el => el.email === email)) : [];
    this.editForm?.get('schedule_name').valueChanges.subscribe(name => {
      this.selectRows[0].isWarmingVisible = this.reportNames.some(el => el === name);
    });
    this.editForm?.get('rpt_run_day').valueChanges.subscribe(() => {
      this.frequency = [];
    });
    this.initAdditionalForm();
  }

  dateConvert(date: any) {
    if (date) {
      return this.datePipe.transform(date, this.dateFormat|| DATE_FORMAT?.FORMATMDY, null, null, true, this.dateFormat);
    } else {
      return null;
    }
  }

  setMembers(members) {
    const userType = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
    this.allMembers = members;
    const membersList = members
      ?.map(({ id, first_name, last_name, email, organization }) => ({
        id: id,
        name:
          userType === 'client' || userType === 'vendor'
            ? `${first_name} ${last_name}`
            : `${first_name} ${last_name} - ${organization?.category} - ${organization?.name}`,
        email: email,
      }))
      .sort((mem1, mem2) => mem1.name.localeCompare(mem2.name));
    this.selectRows[4].options = membersList;
  }

  searchItems(item, row) {
    if (row?.search) {
      if (row?.controlName === 'recipient') {
        this.searchRecipient.next(item);
      }
    }
    return;
  }

  public currentUserRole(): string {
    return this.storageService.get(StorageKeys.CURRENT_ACCOUNT)?.role?.organization_category;
  }

  initAdditionalForm() {
    if (this.getEditForm?.rpt_run_day === 'Weekly') {
      const daysFormControls = {};
      this.daysOfWeek.forEach((day: string) => {
        daysFormControls[day] = new UntypedFormControl(this.parseDay(day.toLowerCase()));
      });
      this.daysForm = new UntypedFormGroup(daysFormControls);
    }
    if (this.getEditForm?.rpt_run_day === 'Monthly') {
      const today = new Date(Date.now());
      const date = today.getFullYear() + '-' + (today.getMonth() > 10
        ? today.getMonth()
        : '0' + today.getMonth()) + '-' + this.frequency?.[0];

      this.daysForm = new UntypedFormGroup({
        week: new UntypedFormControl(this.frequency?.length > 1 ? this.frequency?.[0] : null),
        day: new UntypedFormControl(this.frequency?.length > 1 ? this.frequency?.[1] : null),
        date: new UntypedFormControl(this.frequency?.length > 1 ? date : this.frequency),
        dayOfMonth: new UntypedFormControl(this.frequency?.length <= 1 ? 'specific' : 'usual')
      });
    }
  }

  onClose() {
    this.closeView.emit({ showMessage: false });
    this.initForm();
  }

  onEdit() {
    const formData = this.validateSendingData(this?.report?.report_uuid, this?.report?.report_name);
    this.reportService.updateReport(this.report?.schedule_uuid, formData)
      .subscribe(
        (res:any) => this.closeView.emit({ message: res.data.message, showMessage: true })
      );
  }

  onSchedule() {
    const reportName = this.reportKey
      ? this.reportKey?.toLowerCase()
      : this.report?.report_name || this.reportName.replaceAll(' ', '_').toLowerCase();
    const savedReportData = this.reportDetailsService.savedReportData;
    const reportData = this.reportDetailsService.reportData;

    if (savedReportData?.reportUUID) {
      this.reportService.scheduleCustomReport(this.validateSendingData(savedReportData?.reportUUID)).subscribe(scheduledData => {
        if (!scheduledData?.data.status) {
          this.showError(scheduledData?.data.message);
        } else {
          this.alertService.success('Report has been scheduled successfully.');
          this.closeView.emit({ showMessage: false });
          this.initForm();
        }
      });
    } else {
      const saveFormData: ICustomReportPayload = {
        report_name: reportName,
        reportData: {
          reportName,
          report_filters: {},
          table_columns: reportData?.selected_columns.map(column => column.column_name),
        },
      };
      this.reportService.saveCustomReport(saveFormData).subscribe(data => {
        this.reportService.scheduleCustomReport(this.validateSendingData(data?.report_id, this.reportKey)).subscribe(scheduledData => {
          if (!scheduledData?.data.status) {
            this.showError(scheduledData?.data.message);
          } else {
            this.alertService.success('Report has been scheduled successfully.');
            this.closeView.emit({ showMessage: false });
            this.initForm();
          }
        });
      });
    }
  }

  validateSendingData(reportId: string, report_id?: string) {
    return {
      scheduletData: {
        reportId,
        report_id,
        schedule_name: this.getEditForm?.schedule_name,
        subject: this.getEditForm?.subject,
        rpt_run_day: this.getEditForm?.rpt_run_day.toLocaleLowerCase(),
        rpt_run_frequency: (typeof this.getFrequency === 'object' ? (isNaN(this.getFrequency?.[0]) ? this.getFrequency : this.getFrequency?.[0]) : this.getFrequency),
        is_schedule_day: this.getDaysForm?.dayOfMonth === 'usual' ? 0 : (typeof this.getFrequency === 'object' ? (isNaN(this.getFrequency?.[0]) ? this.getFrequency : this.getFrequency?.[0]) : this.getFrequency),
        runTime: this.getEditForm?.run_time,
        runTime1: this.getEditForm?.time_zone,
        rpt_formate: this.report?.format || 'Excel',
        startDate: this.datePipe.transform(this.getEditForm?.startDate, DATE_FORMAT.FORMATMDY, null, null, true, this.dateFormat),
        endDate: this.datePipe.transform(this.getEditForm?.endDate, DATE_FORMAT.FORMATMDY, null, null, true, this.dateFormat),
        run_schedular_as: this.getEditForm?.run_schedular_as,
        rpt_receivers: this.getEditForm?.reciver.map(item => this.allRoles.filter(el => el.name === item)[0]?.id),
        rpt_receivers_user: this.getEditForm?.recipient?.map(data => data?.id),
        rpt_receivers_email: this?.emails,
        no_end_date: String(Number(this.getEditForm?.noEndDate)),
        is_schedule: String(Number(this.getEditForm?.schedule_status)),
      },
    };
  }

  getDate(date) {
    if (date) {
      return new Date(date);
    }
  }

  resetEndDate(event:any) {
    this.editForm?.controls['endDate']?.setValue('', {emitEvent: false});
  }

  deleteEmail(email: string) {
    this.emails = this.emails.filter(elem => elem !== email);
  }

  addEmail() {
    if (!this.validateEmail(this.getEditForm?.email)) {
      this.isValidEmail = false;
      return;
    }
    if (this.getEditForm?.email && this.emails.every(elem => elem !== this.getEditForm.email)) {
      this.emails.push(this.getEditForm.email);
      this.editForm.get('email').setValue('');
      this.isValidEmail = true;
    }
  }

  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  changeSpecificDate(value = new Date()) {
    this.daysForm.patchValue({ date: new Date(value).getDate() });
  }

  parseDay(day) {
    return this.frequency?.some(element => {
      return element.toLowerCase() === day;
    });
  }

  stringToArray(str): Array<string> {
    return str
      ?.replace(/[\[\]_']/g, '')
      .split(',');
  }

  toggleSchedule() {
    if (!this.viewOnly) {
      this.isScheduled = !this.isScheduled;
    }
  }

  get getFrequency() {
    const usialFrequency = this.getDaysForm?.week + ' ' + this.getDaysForm?.day;
    const monthlyFrequency = this.getDaysForm?.dayOfMonth === 'usual'
      ? usialFrequency.toLowerCase()
      : this.getDaysForm?.date;

    const weeklyFrequency = [];
    for (const day in this.getDaysForm) {
      if (this.getDaysForm[day]) {
        weeklyFrequency.push(day);
      }
    }

    return this.getEditForm?.rpt_run_day === 'Weekly'
      ? weeklyFrequency?.map(item => item.toLocaleUpperCase())
      : monthlyFrequency;
  }

  get buttonEnable() {
    // const notMandatoryFields = [this.getEditForm.reciver, this.getEditForm.recipient, this.emails];
    const notMandatoryFields = [this.getEditForm.recipient, this.emails];
    const isOneNotEmpty = notMandatoryFields.some(elem => Boolean(elem.length));
    const isFormDisable = this.editForm.valid && isOneNotEmpty;

    if (this.getEditForm?.rpt_run_day === 'Weekly' && isFormDisable) {
      return this.getFrequency.length > 0;
    }
    return isFormDisable;
  }

  get recipientUser() {
    return this.report?.reciver_user?.map(item => {
      const foundUser = this.allMembers.filter((el) => el.id === item)[0];
      return ({ name: `${foundUser?.first_name} ${foundUser?.last_name}`, email: foundUser?.email });
    });
  }

  get getEditForm(): any {
    return this.editForm?.value || {};
  }

  get getDaysForm(): any {
    return this.daysForm?.value;
  }
  showError(err){
    // window.scrollTo(0,0);
    this.logs = {
      type: LOG_TYPE.ERROR, heading: err?.error?.error?.message ? err?.error?.error?.message : err, messages: [], autoClose: true, isShown: true, showReportButton: err?.status == 500, additionalInfo:{trace_id: err?.error?.trace_id } };
      err?.error?.error?.errors?.forEach(msg => {
        if (msg?.message) {
          this.logs.messages.push(msg?.message);
        }
      });
  }
}
