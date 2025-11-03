import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { LOG_TYPE, Log } from 'src/app/library/logs/logs.model';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';
import {  SelectorOption,  CostComponentGroupDetailData } from '../models/model';
import { ActivatedRoute } from '@angular/router';
import { SelectorModalComponent } from 'src/app/self-configuration/components/selector-modal/selector-modal.component';


@Component({
  selector: 'app-create-cost-component-group',
  templateUrl: './create-cost-component-group.component.html',
  styleUrls: ['./create-cost-component-group.component.scss'],
})
export class CreateCostComponentGroupComponent implements OnInit {
  DEFAULT_SIZE = 5;
  isEdit: boolean = false;
  isShowTryOutModal: boolean = false;
  logs: Log;
  costComponentGroupId: string;
  detailData: CostComponentGroupDetailData;
  costComponents: SelectorOption[] = [];
  programId: string;

  // for search 
  searchText = ""
  searchLoading = false
  totalRecords = 0
  page = 1


  @ViewChild(SelectorModalComponent) selector: SelectorModalComponent;
  constructor(
    private router: SvmsRouterService,
    private programService: ProgramService,
    private storageService: StorageService,
    private loader: LoaderService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // get component list
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    const costComponentGroupId = this.activatedRoute.snapshot.params.id;
    // init default 
    this.detailData = {
      name : '',
      cost_component: [],
      meta_data: [],
      is_enabled: true
    }
    if (costComponentGroupId) {
      this.isEdit = true;
      this.getCostComponentGroup(costComponentGroupId)  
    }
  }

  showError(err){
    window.scrollTo(0, 0);

    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true,
      showReportButton: err?.status == 500,
      additionalInfo:{trace_id: err?.error?.trace_id }
    };

    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
        this.logs.messages.push(msg?.message);
      }
    });
  }

  getCostComponentGroup(costComponentGroupId: string) {
    this.loader.show();
    this.programService.get(`/core-money/programs/${this.programId}/cost-component/component_groups/${costComponentGroupId}`).subscribe({
      next: (data: any) => {
        this.loader.hide();
        this.detailData = data?.cost_component_group_data;
        const options = this.detailData.meta_data.map((entry, idx)=>({
          _it: idx,
          name: entry.component_name,
          value: JSON.stringify({code:entry.code, id: entry.id}),
          is_selected: true
        }));
        this.costComponents = options;
        this.selector.internalOptions = options;
      },
      error: (err) => {
        this.loader.hide();
        this.router.navigate(['rate', 'cost-component', 'list']);
        this.alertService.error(errorHandler(err));
      }
    });
  }

  

  searchCostComponents(searchText: string): void {
    this.searchLoading = true
    if(this.searchText != searchText){
      this.page = 1 
      this.costComponents = []
    }
    let query = `?limit=${this.DEFAULT_SIZE}&page=${this.page}&is_enabled=true`;
    if (searchText) {
      query = `${query}&name=${searchText}`;
    }
    const url = `/core-money/programs/${this.programId}/cost-component/component${query}`;
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.searchLoading = false
        const selectedId = this.detailData.meta_data.map(entry => entry.id)
        const new_components = data.cost_components
        .filter(entry=> !selectedId.includes(entry.id))
        .map(entry => ({
          name: entry.name,
          value: JSON.stringify({code:entry.code, id: entry.id}),
        }));
        this.costComponents = [...this.costComponents, ...new_components]
        this.searchText = searchText 
        this.totalRecords = data.total_records
      },
      error: (err) => {
        this.searchLoading = false
        this.alertService.error(errorHandler(err));
      }
    })
  }

  showMore(): void {
    if ((this.page)*this.DEFAULT_SIZE+1 > this.totalRecords)
      return 
    this.page+=1
    this.searchCostComponents(this.searchText)
  }

  isValidateMetaData(): boolean {
    const levels = this.detailData.meta_data.map(entry => entry.level)
    levels.sort()
    if (levels.length > 0 && levels[0] != 1) {
      this.showError("Level should start at 1")
      return false
    }
    for(let i = 0; i< levels.length -1 ; i++) {
      if(levels[i+1] - levels[i] > 1){
        this.showError(`Missing level(s) between level ${levels[i]} and level ${levels[i+1]}`)
        return false
      }
    }
    const values = this.detailData.meta_data.map(entry => entry.value)
    if (values.some(number=> number == null || number<=0 )) {
      this.showError(`Component value should not be empty and smaller than or equal to 0`)
      return false
    }
    return true
  }


  isValidateData(): boolean {
    if (!this.detailData?.name){
      this.showError('Name should not be empty')
      return false
    }
    return this.isValidateMetaData()
  }


  submit(): void {
    if (!this.isValidateData())
      return 

    const url = `/core-money/programs/${this.programId}/cost-component/component_groups`;
    const payload = {
      name: this.detailData?.name,
      cost_component_ids: this.detailData.meta_data.map(entry => entry.id),
      meta_data: this.detailData.meta_data,
      is_enabled: this.detailData.is_enabled
    }
    const callback = (message: string)=>{
      return {
        next: (_: any) => {
          this.loader.hide()
          this.alertService.success(message);
          this.backToList()
        },
        error: (err) => {
          this.loader.hide()
          this.showError(err);
        }
      }
    } 

    this.loader.show()
    if (!this.detailData.id) {
      //create
      this.programService.post(url, payload).subscribe(callback('Cost Component Group created successfully'))
    }else {
      // update
      this.programService.put(`${url}/${this.detailData.id}`, payload).subscribe(callback('Cost Component Group updated successfully'))
    }

  }

  backToList(): void {
    this.router.navigate(['rate', 'cost-component-group', 'list']);
  }

  toggleActive(): void {
    this.detailData.is_enabled = !this.detailData.is_enabled;
  }

  openTryOut(): void {
    if (this.isValidateMetaData()){
      this.isShowTryOutModal = true;
    }
  }

  closeTryOut(): void {
    this.isShowTryOutModal = false;
  }


  addCostComponents(options: SelectorOption[]): void {
    // fire create/update immediate dont ask me why
    let defaultValue = {
        level: 1,
        value: 0,
        unit: 'PERCENTAGE',
    } as const

    let new_meta_data = options
      .filter(entry => entry.is_selected)
      .map(entry => ({
        id: JSON.parse(entry.value).id,
        component_name: entry.name,
        code: JSON.parse(entry.value).code,
        ...defaultValue,
        ...this.detailData.meta_data.find(data=> data.component_name == entry.name)
      }));

    this.detailData.meta_data = new_meta_data
  }

  // since name is unique
  deleteCostComponent(it: number): void {
    this.selector.removeSelection(it)
  }
}
