import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { LocalDateFormatPipe } from 'src/app/shared/pipe/local-date-format.pipe';
import { JobDetailsComponent } from 'src/app/jobs/job-details/job-details.component';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { AwsS3FileUploadService } from 'src/app/shared/service/utility/aws.s3.upload.service';
import { AccuracyPipe } from 'src/app/shared/pipe/accuracy.pipe';
import { JobDetailsService } from '../../job-details.service';
import { customFields as customFieldsEnums } from 'src/app/library/custom-fields/CustomFields.enum';
import { forkJoin } from 'rxjs';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import * as _ from 'lodash';
import { TitleCasePipe } from '@angular/common';
@Component({
  selector: 'app-history-details',
  templateUrl: './history-details.component.html',
  styleUrls: ['./history-details.component.scss'],
})
export class HistoryDetailsComponent implements OnInit {
  @Input() historyData: any;
  @Input() viewHistoryPanel: string = 'hidden';
  @Input() customFields:any;

  historyDetailedList: any = [];
  maxContentLength: number = 100;
  public toggleDescription = {
    oldDescription: false,
    newDescription: false,
  };

  displayList = [
    { key: 'status', label: 'Status', order: 0 },
    { key: 'job_manager', label: 'Job Manager', order: 1 },
    { key: 'hierarchy', label: 'Hierarchy', order: 2 },
    { key: 'program_industry', label: 'Labor Category', order: 3 }, // Updating Program Industry to Labor Category
    { key: 'description', label: 'Job Description', order: 4 },
    { key: 'jd_parsing_file', label: 'Job Description (Uploaded File)', order: 5 },
    { key: 'job_description_file', label: 'Job Attachment (Uploaded File)', order: 6 },
    { key: 'qualifications', label: 'Qualifications', order: 7 },
    { key: 'start_date', label: 'Start Date', order: 8 },
    { key: 'end_date', label: 'End Date', order: 9 },
    { key: 'duration', label: 'Duration', order: 10 },
    { key: 'positions', label: 'Number of Positions', order: 11 },
    { key: 'is_expense_allowed', label: 'Expense Allowed', order: 12 },
    { key: 'unit_of_measure', label: 'Unit of Measure', order: 13 },
    { key: 'min_pay_rate', label: 'Min Pay Rate', order: 14 },
    { key: 'max_pay_rate', label: 'Max Pay Rate', order: 15 },
    { key: 'min_bill_rate', label: 'Min Bill Rate', order: 16 },
    { key: 'max_bill_rate', label: 'Max Bill Rate', order: 17 },
    { key: 'is_ot_exempt', label: 'OT Exempt', order: 18 },
    { key: 'budget_estimate', label: 'Estimated Budget', order: 19 },
    { key: 'submission_count', label: 'Submission Count', order: 20 },
    { key: 'foundational_data', label: 'Master Data', order: 21 },
    { key: 'custom_fields', label: 'Custom Fields', order: 22 },
    { key: 'approver', label: 'Approver Replaced', order: 23 },
    { key: 'reviewer', label: 'Reviewer Replaced', order: 24 },
    { key: 'min_budget', label: 'Min Budget', order: 25 },
    { key: 'max_budget', label: 'Max Budget', order: 26 },
    { key: 'budget_estimate', label: 'Budget Estimate', order: 27 },
    { key: 'filled_positions', label: 'Filled Positions', order: 28 }
  ];

  @Output() onClose = new EventEmitter<string>();

  constructor(
    private localDatePipe: LocalDateFormatPipe,
    private accuracyPipe: AccuracyPipe,
    private jobDet: JobDetailsComponent,
    private snakeToTitle: SnakeToTitleCasePipe,
    private s3UploadService: AwsS3FileUploadService,
    private jobDetService: JobDetailsService,
    private loaderService: LoaderService,
    private cd: ChangeDetectorRef,
    private alertService: AlertService,
    private titlecase: TitleCasePipe
  ) {}

  ngOnInit(): void {
    this.customFields = _.cloneDeep(this.customFields);
    this.historyData = _.cloneDeep(this.historyData);
    if (this.historyData) {
      this.displayList.sort((d1, d2) => (d1.order < d2.order ? -1 : 1));
      this.displayList.forEach(d => {
        if (this.historyData?.new_data[d.key] || typeof(this.historyData?.new_data[d.key])==='boolean') {
          let newValue = '';
          let oldValue = '';
          let newValFile = null;
          let oldValFile = null;
          switch (d.key) {
            case 'is_ot_exempt': 
            case 'is_expense_allowed':
              newValue = this.historyData?.new_data[d.key] === true ? "Yes" : "No";
              oldValue = this.historyData?.old_data[d.key] === true ? "Yes" : "No";
              break;
            case 'unit_of_measure': 
              newValue = this.titlecase.transform(this.historyData?.new_data[d.key]);
              oldValue = this.titlecase.transform(this.historyData?.old_data[d.key]);
              break;
            case 'hierarchy':
            case 'program_industry':
              newValue = this.historyData?.new_data[d.key][0].name;
              oldValue = this.historyData?.old_data[d.key][0].name;
              break;
            case 'job_manager':
              let temp = this.historyData?.new_data[d.key];
              newValue = `${temp?.name_prefix ?? ''} ${temp?.first_name ?? ''} ${temp?.middle_name ?? ''} ${temp?.last_name ?? ''} ${
                temp?.name_suffix ?? ''
              }`;
              temp = this.historyData?.old_data[d.key];
              oldValue = `${temp?.name_prefix ?? ''} ${temp?.first_name ?? ''} ${temp?.middle_name ?? ''} ${temp?.last_name ?? ''} ${
                temp?.name_suffix ?? ''
              }`;
              break;
            case 'start_date':
            case 'end_date':
              newValue = this.historyData?.new_data[d.key]
                ? this.localDatePipe.transform(this.historyData?.new_data[d.key]?.split('T')?.[0], null, null, null, true)
                : this.historyData?.new_data[d.key];
              oldValue = this.historyData?.old_data[d.key]
                ? this.localDatePipe.transform(this.historyData?.old_data[d.key]?.split('T')?.[0], null, null, null, true)
                : this.historyData?.old_data[d.key];
              break;
            case 'min_pay_rate':
            case 'max_pay_rate':
            case 'min_bill_rate':
            case 'max_bill_rate':
            case 'budget_estimate':
              newValue = this.accuracyPipe.transform(this.historyData?.new_data[d.key], d.key === 'budget_estimate' ? 'amount' : 'rate', {
                currencyCode: this.historyData?.new_data.currency,
              });
              oldValue = this.accuracyPipe.transform(this.historyData?.old_data[d.key], d.key === 'budget_estimate' ? 'amount' : 'rate', {
                currencyCode: this.historyData?.old_data.currency,
              });
              break;
              case 'min_budget':
              case 'max_budget':
                newValue = this.accuracyPipe.transform(this.historyData?.new_data[d.key], 'amount', {
                            currencyCode: this.historyData?.new_data?.currency});
                oldValue = this.accuracyPipe.transform(this.historyData?.old_data[d.key], 'amount' , {
                            currencyCode: this.historyData?.old_data?.currency});
                break;
            case 'duration':
              let tempD = this.historyData?.new_data[d.key];
              newValue =
                (tempD?.years ? tempD?.years + ' Year(s) ' : '') +
                (tempD?.weeks ? tempD?.weeks + ' Week(s) ' : '') +
                tempD?.days +
                ' Day(s)';
              tempD = this.historyData?.old_data[d.key];
              oldValue =
                (tempD?.years ? tempD?.years + ' Year(s) ' : '') +
                (tempD?.weeks ? tempD?.weeks + ' Week(s) ' : '') +
                tempD?.days +
                ' Day(s)';
              break;
            case 'description':
              newValue = this.historyData?.new_data[d.key];
              oldValue = this.historyData?.old_data[d.key];
              if (oldValue?.length > 0) {
                oldValue = '<del>' + oldValue + '</del>';
              }
              break;
            case 'status':
              newValue = this.jobDet.getJobDisplayStatus(this.historyData?.new_data[d.key]);
              oldValue = this.jobDet.getJobDisplayStatus(this.historyData?.old_data[d.key]);
              break;
            case 'foundational_data':
              this.historyData?.new_data[d.key].forEach(elem => {
                const oldVal = this.historyData?.old_data[d.key].find(f => f.foundation_data_type.id === elem.foundation_data_type.id);
                this.historyDetailedList.push({
                  label: `${this.snakeToTitle.transform(d.label)} - ${elem.foundation_data_type.name}`,
                  newValue: `${elem.foundation_data.name} - ${elem.foundation_data.code}`,
                  oldValue: oldVal ? `${oldVal.foundation_data.name} - ${oldVal.foundation_data.code}` : null,
                });
              });
              break;
            case 'custom_fields':
              Object.keys(this.historyData?.new_data[d.key])?.forEach(key => {
                newValFile = null;
                oldValFile = null;
                if (this.historyData?.new_data[d.key][key]?.ext || this.historyData?.old_data[d.key][key]?.ext) {
                  this.historyDetailedList.push({
                    label: `${this.snakeToTitle.transform(d.label)} - ${this.snakeToTitle.transform(key)}`,
                    newValue: this.historyData?.new_data[d.key] ? this.historyData?.new_data[d.key][key]?.['name'] : null,
                    oldValue: this.historyData?.old_data[d.key] ? this.historyData?.old_data[d.key][key]?.['name'] : null,
                    newValFile: this.historyData?.new_data[d.key] ? this.historyData?.new_data[d.key][key] : null,
                    oldValFile: this.historyData?.old_data[d.key] ? this.historyData?.old_data[d.key][key] : null,
                  });
                } else {
                  this.customFields?.forEach(field => {
                    if(field?.slug == key && field?.type?.toLocaleLowerCase() == customFieldsEnums?.SOURCE?.toLocaleLowerCase()) {
                      this.historyData.new_data[d.key][key] = {
                        value: this.historyData.new_data[d.key][key],
                        key,
                        api_url: field?.api_url,
                        isSourceField: true
                      }
                      this.historyData.old_data[d.key][key] = {
                        value: this.historyData.old_data[d.key][key],
                        key,
                        api_url: field?.api_url,
                        isSourceField: true
                      }
                    } else if(field?.slug == key && field?.type?.toLocaleLowerCase() == customFieldsEnums?.DROPDOWN?.toLocaleLowerCase()) {
                      field?.meta_data?.datasource?.options?.forEach((res)=>{
                        if(res?.value === this.historyData?.new_data?.[d?.key]?.[key]) {
                          this.historyData.new_data[d.key][key] = res?.label
                        }
                      })
                    }
                  });
                    const obj = {
                      label: `${this.snakeToTitle.transform(d.label)} - ${this.snakeToTitle.transform(key)}`,
                      newValue: this.historyData?.new_data[d.key]
                        ? typeof this.historyData?.new_data[d.key][key] === 'number' &&
                          this.historyData?.new_data[d.key][key].toString().length >= 13
                          ? this.localDatePipe.transform(this.historyData?.new_data[d.key][key], null, null, null, true)
                          : this.historyData?.new_data[d.key][key]
                        : null,
                      oldValue: this.historyData?.old_data[d.key]
                        ? typeof this.historyData?.old_data[d.key][key] === 'number' &&
                          this.historyData?.old_data[d.key][key].toString().length >= 13
                          ? this.localDatePipe.transform(this.historyData?.old_data[d.key][key], null, null, null, true)
                          : this.historyData?.old_data[d.key][key]
                        : null,
                    };
                    if(this.historyData.new_data[d.key][key]?.isSourceField) {
                      obj['isSourceField'] = true;
                      obj['sourceData'] = this.historyData.new_data[d.key][key]
                    }
                    this.historyDetailedList.push(obj);
                    if(this.historyData.new_data[d.key][key]?.isSourceField) {
                      this.addSourceFields(this.historyDetailedList.length - 1, obj);
                    }
                  }
              });
              break;
            case 'job_description_file':
            case 'jd_parsing_file':
              newValue = this.historyData?.new_data[d.key] ? this.historyData?.new_data[d.key] : [];
              oldValue = this.historyData?.old_data[d.key] ? this.historyData?.old_data[d.key] : [];
              break;
            case 'qualifications':
              let qualifications = new Array();
              this.historyData?.new_data[d.key]?.forEach(element => {
                if (!qualifications?.includes(element?.qualification_type?.code)) {
                  qualifications.push(element?.qualification_type?.code);
                }
              });
              qualifications.forEach(element => {
                let qualificationName = this.historyData?.new_data[d.key]?.find(qual => qual?.qualification_type?.code === element)
                  ?.qualification_type?.name;
                let currentQualification = this.historyData?.new_data[d.key]
                  ?.filter(qual => qual?.qualification_type?.code === element)
                  ?.map(element => element?.name);
                let previousQualification = this.historyData?.old_data[d.key]
                  ?.filter(qual => qual?.qualification_type?.code === element)
                  ?.map(element => element?.name);
                this.historyDetailedList.push({
                  label: `${this.snakeToTitle.transform(d.label)} - ${qualificationName}`,
                  newValue: currentQualification?.length > 0 ? currentQualification?.join(', ') : null,
                  oldValue: previousQualification?.length > 0 ? previousQualification?.join(', ') : null,
                });
              });
              break;
            case 'approver':
              let res = this.historyData?.new_data[d.key];
              newValue = `${res?.name_prefix ?? ''} ${res?.first_name ?? ''} ${res?.middle_name ?? ''} ${res?.last_name ?? ''} ${
                res?.name_suffix ?? ''}`;
              res = this.historyData?.old_data[d.key];
              oldValue = `${res?.name_prefix ?? ''} ${res?.first_name ?? ''} ${res?.middle_name ?? ''} ${res?.last_name ?? ''} ${
                res?.name_suffix ?? ''}`;
              if(this.historyData?.activity.toLowerCase() === "job reviewer reassigned"){
                d.label = 'Reviewer Replaced'
              }
              break;
            case 'reviewer':
              let newApprovers = new Array();
              this.historyData?.new_data[d.key].forEach(element => {
                newApprovers.push(element?.name);
              });
              let oldApprovers = new Array();
              this.historyData?.old_data[d.key].forEach(element => {
                oldApprovers.push(element?.name);
              });
              newValue = newApprovers?.join(', ');
              oldValue = oldApprovers?.join(', ');
              break;
            default:
              newValue = this.historyData?.new_data[d.key];
              oldValue = this.historyData?.old_data[d.key] ? this.historyData?.old_data[d.key] : (typeof this.historyData?.new_data[d.key] == 'number' ? '0' : null);
          }
          if (newValue || oldValue) {
            this.historyDetailedList.push({
              label: d.label,
              newValue: newValue,
              oldValue: oldValue,
              key: d.key,
              newValFile,
              oldValFile
            });
          }
        }
      });
    }
  }

  closehistoryView() {
    this.onClose.emit();
  }

  downloadS3Attachment(file: any) {
    if (file && file.name && file.key) {
      this.s3UploadService.downloadS3Attachment(file);
    }
  }

  contentViewToggle(data) {
    this.toggleDescription[data] = !this.toggleDescription[data];
  }

  isArray(item) {
    return Array.isArray(item);
  }

  getNotesStatus(historyData) {
    let label = '';
    switch (historyData?.new_data?.status?.toLowerCase()) {
        case 'rejected':
          label = 'Rejected '
          break;
        case 'closed':
          label = 'Closed '
          break;
        case 'reviewed':
          label = 'Reviewed ';
          break;
    }
    return label;
  }

  addSourceFields(index, sourceField) {
    this.loaderService.show();
    let newValUrl = sourceField?.newValue?.api_url
    newValUrl = newValUrl.includes('?') ? newValUrl += `&user_ids=${sourceField?.newValue?.value}` : newValUrl += `&user_ids=${sourceField?.newValue?.value}`;

    let oldValUrl = sourceField?.oldValue?.api_url
    oldValUrl = oldValUrl.includes('?') ? oldValUrl += `&user_ids=${sourceField?.oldValue?.value}` : oldValUrl += `&user_ids=${sourceField?.oldValue?.value}`;

    const newURLObservable = this.jobDetService.get(newValUrl);
    const oldURLObservable = this.jobDetService.get(oldValUrl);
    forkJoin([oldURLObservable, newURLObservable]).subscribe({
      next: (res:any) => {
        sourceField.oldValue = res?.[0]?.members?.[0]?.full_name;
        sourceField.newValue = res?.[1]?.members?.[0]?.full_name;
        this.loaderService.hide();
      },
      error: (err:any) => {
        this.alertService.alert(err);
        this.loaderService.hide();
      }
    });
    setTimeout(()=>{
      this.cd.detectChanges();
    },1000);
  }
}
