import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup  } from '@angular/forms';
import { StorageService } from 'src/app/core/services/storage.service';
import { ProgramService } from 'src/app/programs/program.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { ProgramConfig } from 'src/app/shared/enums';
import { errorHandler } from 'src/app/shared/util/error-handler';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'tree-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
  public hierarchyLevelName = '';
  public managers = '';
  public createdDate: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };
  public effectiveDate: any = {
    language: 'English',
    timepicker: true,
    format12h: true,
    range: true
  };
  public programDetails = JSON.parse(this.storageService.get(ProgramConfig[0]));
  membersList: any;
  hierarchyFilter: UntypedFormGroup;
  status = [
    {name: 'ACTIVE', value: true },
    {name: 'INACTIVE', value: false }
  ];

  @Input() flattednedHierarchy;
  @Output() onSearch = new EventEmitter();
  @Output() togglefilter = new EventEmitter();

  constructor(
    private storageService :StorageService,
    private programService : ProgramService,
    private alertService : AlertService,
    private fb :UntypedFormBuilder,
  ) { }

  ClearFilter() {
    this.hierarchyFilter.reset();
    this.onSearch.emit(null);
    this.closeFilter();
  }

  closeFilter() {
    this.togglefilter.emit(true);
  }

  ngOnInit(): void { 
    this.getMembersList();
    this.getHierarchy();
    this.hierarchyFilter = this.fb.group({
      hierarchyName: [[]],
      managers :[''],
      status: [null],    
    })
  }

  getHierarchy() {
      let programDetails = JSON.parse(this.storageService.get('NewProgramData'));
      let programId = programDetails['program_req_id'];
      let url = `/configurator/programs/${programId}/hierarchy`;
      this.programService.get(url).subscribe(
        (data:any) => {
          if (data) {
            this.flattednedHierarchy = [];
            this.flattenHierarchy(data.result[0].hierarchies);
            this.flattednedHierarchy = this.flattednedHierarchy.splice(1);
          }
        });
    }
  
    flattenHierarchy = (hierarchies: any) => {
      if(hierarchies?.length < 1){
        return ;
      }
      hierarchies?.forEach((hierarchy: any) => {
        this.flattednedHierarchy.push(hierarchy);
        this.flattenHierarchy(hierarchy?.hierarchies);
      })
    }

  filterHierarchy() {
    let payload = {}
    if(this.hierarchyFilter.controls.hierarchyName.value?.length > 0){
      payload['name']=this.hierarchyFilter.controls.hierarchyName.value;
    }
    if(this.hierarchyFilter.controls.status.value == true || this.hierarchyFilter.controls.status.value == false){
      payload['is_enabled']=this.hierarchyFilter.controls.status.value;
    }
    this.onSearch.emit(payload);
    this.closeFilter();
   }

  getMembersList(){
    let programId = this.programDetails['program_req_id'];
    this.programService.get(`/configurator/programs/${programId}/members?org_ids=${environment.SIMPLIFY_ORG_ID}`).subscribe({
      next: (data: any) => {
        if(data){
          this.membersList = data.members;
        }
    },
    error: err => {
      this.alertService.error(errorHandler(err));
    }});
  }

}
