import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SnakeToTitleCasePipe } from 'src/app/shared/pipe/snake-to-title-case.pipe';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-candidate-history-view',
  templateUrl: './candidate-history-view.component.html',
  styleUrls: ['./candidate-history-view.component.scss']
})
export class CandidateHistoryViewComponent implements OnInit {

  candidateData:any;
  entity_ref:any;
  oldData;
  newData;
  isVendorNeutral;
  userRole;
  historyDetailedList: any = [];
  currentProgram = this.storageService.get(StorageKeys.CURRENT_PROGRAM);
  user_type = this.storageService.get(StorageKeys.USER_TYPE)?.toLowerCase();
  offerData: any;
  interviewData: any;
  @Input() public set historyData(historyData: any) {
     this.candidateData = historyData;
     this.entity_ref = historyData?.reference;
     if(historyData?.activity.toLowerCase().includes("reassigned")){
      this.offerData = this.candidateData?.api_data?.backend_data?.reassign_data?.offer;
      this.interviewData = this.candidateData?.api_data?.backend_data?.reassign_data?.interview;
      this.oldData = this.candidateData?.api_data?.backend_data?.reassign_data?.old_user;
      this.newData = this.candidateData?.api_data?.backend_data?.reassign_data?.new_user;
    }else{
      this.oldData = this.candidateData?.api_data?.backend_data?.old_data;
      this.newData = this.candidateData?.api_data?.backend_data?.new_data;
    }
  }
  getStatus(str){
    return str?.toLowerCase().replace(/_/g, ' ')
    .replace(/(?: |\b)(\w)/g, function(key, p1) {
        return key.toUpperCase();
    })
  }
  @Input() viewHistoryPanel: string = 'hidden';
  @Output() onClose = new EventEmitter<string>();

  displayList = [
    { key: 'first_name', label: 'First Name', order: 0 },
    { key: 'middle_name', label: 'Middle Name', order: 1 },
    { key: 'last_name', label: 'Last Name', order: 2 },
    { key: 'name_suffix', label: 'Prefix', order: 3 },
    { key: 'email', label: 'Email', order: 4 },
    { key: 'email_secondary', label: 'Secondary Email', order: 5 },
    { key: 'phone_number', label: 'Phone Number', order: 6 },
    { key: 'phone_number_secondary', label: 'Phone Number Secondary', order: 7 },
    { key: 'iso2_code', label: 'Country', order: 8 },
    { key: 'qualifications', label: 'Qualifications', order: 9 },
    { key: 'foundational_data', label: 'Master Data', order: 10 },
    { key: 'custom_fields', label: 'Custom Fields', order: 11 },
    { key: 'addresses', label: 'Primary Address', order: 12 },
    { key: 'user', label: 'User', order: 13 },
  ];

  constructor(
    private snakeToTitle: SnakeToTitleCasePipe,
    private storageService: StorageService

  ) { }

  ngOnInit(): void {
    this.isVendorNeutral = this.currentProgram.config?.is_vendor_neutral;
    const user = JSON.parse(localStorage.getItem('account'))
    this.userRole = user?.role?.organization_category?.toLowerCase();
    if(this.oldData) {
      this.displayList?.sort((d1, d2) => (d1.order < d2.order ? -1 : 1));
      this.displayList?.forEach(d => {
        if (this.newData[d.key]) {
          let newValue = '';
          let oldValue = '';
          switch (d.key) {
            case 'addresses':
              const oldPrimaryVal = this.oldData[d.key].find(f => f.type.toLowerCase() == 'primary');
              const oldSecondVal = this.oldData[d.key].find(f => f.type.toLowerCase() == 'secondary');
              this.newData[d.key]?.forEach(elem => {
                if(elem.type.toLowerCase() == 'primary') {
                  if(JSON.stringify(elem) != JSON.stringify(oldPrimaryVal)) {
                    this.historyDetailedList.push({
                      label: 'Primary Address ',
                      newValue:elem,
                      oldValue:oldPrimaryVal,
                      key:'primary_address'
                    });
                  }
                }
                if(elem.type.toLowerCase() == 'secondary') {
                  if(JSON.stringify(elem) != JSON.stringify(oldSecondVal)) {
                    this.historyDetailedList.push({
                      label: 'Secondary Address',
                      newValue:elem,
                      oldValue:oldSecondVal,
                      key:'secondary_address'
                    });
                  }
                }
              });
              break;
            case 'foundational_data':
              this.newData[d.key]?.forEach(elem => {
                const oldVal = this.oldData[d.key].find(f => f.foundation_data_type.id === elem.foundation_data_type.id);
                this.historyDetailedList.push({
                  label: `${this.snakeToTitle.transform(d.label)} - ${elem.foundation_data_type.name}`,
                  newValue: `${elem.foundation_data.name} - ${elem.foundation_data.code}`,
                  oldValue: oldVal ? `${oldVal.foundation_data.name} - ${oldVal.foundation_data.code}` : null,
                });
              });
              break;
            case 'custom_fields':
              Object.keys(this.newData[d.key])?.forEach(key => {
                this.historyDetailedList.push({
                  label: `${this.snakeToTitle.transform(d.label)} - ${this.snakeToTitle.transform(key)}`,
                  newValue: this.newData[d.key] ? this.newData[d.key][key] : null,
                  oldValue: this.oldData[d.key] ? this.oldData[d.key][key] : null,
                });
              });
              break;
            case 'qualifications':
              newValue = this.newData[d.key][0].qualification_name;
              oldValue = this.oldData[d.key][0].qualification_name;
              break;

            case 'user':
              const newFullName = (this.newData?.[d.key]?.first_name ? this.newData?.[d.key]?.first_name : '') + " " + 
                (this.newData?.[d.key]?.middle_name ? this.newData?.[d.key]?.middle_name : '') + " " + 
                (this.newData?.[d.key]?.last_name ? this.newData?.[d.key]?.last_name : '');
              const oldFullName = (this.oldData?.[d.key]?.first_name ? this.oldData?.[d.key]?.first_name : '') + " " + 
                (this.oldData?.[d.key]?.middle_name ? this.oldData?.[d.key]?.middle_name : '') + " " + 
                (this.oldData?.[d.key]?.last_name ? this.oldData?.[d.key]?.last_name : '');
              const historyLabel = this.offerData?.reassigned_user || this.interviewData?.reassigned_user;
              
              this.historyDetailedList.push({
                label: historyLabel || "",
                newValue: newFullName,
                oldValue: oldFullName,
                key: 'user'
              });
              break;

            default:
              newValue = this.newData[d.key];
              oldValue = this.oldData[d.key];
          }
              if (newValue || oldValue)
                this.historyDetailedList.push({
                  label: d.label,
                  newValue: newValue,
                  oldValue: oldValue,
                  key:d.key
                });
        }
      });
    }
  }

  checkObj(obj1,obj2) {
     Object.keys(obj1).length === Object.keys(obj2).length &&
    (Object.keys(obj1) as (keyof typeof obj1)[]).every((key) => {
      return (
        Object.prototype.hasOwnProperty.call(obj2, key) && obj1[key] === obj2[key]
      );
    });
  }


  closehistoryView() {
    this.onClose.emit();
  }
}
