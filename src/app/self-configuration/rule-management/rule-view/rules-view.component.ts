import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { LocalDateTimeFormatPipe } from 'src/app/shared/pipe/local-date-time-format.pipe';
import { SortHelperPipe } from 'src/app/shared/pipe/sort-helper.pipe';
import { CommonViewRuleFlowService } from 'src/app/shared/components/common-view-rule-flow/common-view-rule-flow.service';
import { ITableOptions } from 'src/app/library/svms-table/svms-table.model';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { UniqueKeyPipe } from 'src/app/shared/pipe/unique-key.pipe';

@Component({
  selector: 'app-rules-view',
  templateUrl: './rules-view.component.html',
  styleUrls: ['./rules-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RulesViewComponent implements OnInit {
  @ViewChild('uploadFileInput') uploadFileInput: ElementRef;
  ruleData: any;
  programId: any;
  ruleId: any;
  oldJobDescriptionFile;
  details: any = [];
  public dateFormat;
  programDetails: any = {};
  tableData: any;
  rowData: any;
  downloadButtonText: string = 'Download Template File'
  disabledDownloadButton: boolean = false;
  tableKeys: any = [];
  outputColumns: any = []
  UploadButtonText: string = 'Upload Rule File'
  showPageSettingData: boolean = true
  itemsPerPage = 10
  recordsPerPageSetting = [10, 25, 50, 100]
  currentPage = 1;
  totalPages;
  tableOptions: ITableOptions;
  alltableData: any = []
  newlyAddedData: any = {}
  searchText: any = '';
  columnName: any = '';
  searchTerm: any = '';
  universalData: any = []
  allFilteredData: any = []
  underProcess: boolean = false;
  editMode: boolean = false;
  cancelWarningModal: boolean = false;
  goBackWarningModal: boolean = false;
  addRecordModal: boolean = false;
  removeRecordModal: boolean = false;
  filterApplied: boolean = false;
  removeIndex: number = -1;
  dataConfig: any;
  hierarchies: any = [];
  public scrollConfig: PerfectScrollbarConfigInterface = { suppressScrollX: false, suppressScrollY: true };

  constructor(
    private router: SvmsRouterService,
    private route: ActivatedRoute,
    private alert: AlertService,
    private programService: ProgramService,
    private localDataTime: LocalDateTimeFormatPipe,
    private loader: LoaderService,
    private localStorage: StorageService,
    private sortPipe: SortHelperPipe,
    public commonViewService: CommonViewRuleFlowService,
    private uniqueKeyPipe: UniqueKeyPipe,
  ) { this.programDetails = this.localStorage.get(StorageKeys.CURRENT_PROGRAM); }

  ngOnInit(): void {
    this.dateFormat = this.programDetails?.defaultDateFormat;
    this.programId = this.localStorage.get(StorageKeys.PROGRAM_ID);
    this.ruleId = this.route.snapshot.paramMap.get('id');
    this.getRuleDetails();
  }

  backtoList() {
    this.router.navigate(['program', 'rules-builder', 'list'])
  }

  editRule() {
    this.router.navigate(['program', 'rules-builder', 'edit', this.ruleId]);
  }

  pageCount() {
    const itemsPerPage: number = this.itemsPerPage || 10;
    this.totalPages = 1;
    if (this.filterApplied ? this.allFilteredData.length : this.alltableData.length) {
      this.totalPages = Math.ceil((this.filterApplied ? this.allFilteredData.length : this.alltableData.length) / itemsPerPage);
    }
  }

  onClickRecords(event) {
    this.itemsPerPage = event
    this.onPaginationClick(1, this.alltableData)
  }

  addNewData() {
    this.loader.show()
    let allDataFilled = true;
    for(let i=0;i<this.tableKeys.length;i++){
      if((!this.newlyAddedData["ND_"+this.tableKeys[i]] && this.dataConfig[this.tableKeys[i]].fieldType != "NUMBER") || (this.dataConfig[this.tableKeys[i]].fieldType == "NUMBER" && (isNaN(Number(this.newlyAddedData["ND_"+this.tableKeys[i]]))))){
        allDataFilled = false
        this.loader.hide();
        this.alert.error('Please fill all data', {});
        break;
      }
    }
    if(allDataFilled){
      const maxSequence = this.alltableData.length > 0 ? Math.max(...this.alltableData.map(item => item.sequence)) : -1;
      this.newlyAddedData["sequence"] = maxSequence + 1
      this.newlyAddedData["actionFlag"] = "New";
      // new data contains only id of dropdown so looping through each key of json finding respected text and assign to new key
      for (let i = 0; i < this.tableKeys.length; i++) {
        if (this.dataConfig[this.tableKeys[i]].fieldType == "DROPDOWN") {
          this.newlyAddedData[this.tableKeys[i]] = this.dataConfig[this.tableKeys[i]].items.filter(f => f.id == this.newlyAddedData["ND_" + this.tableKeys[i]])[0].name
          let tempData = [{id:this.newlyAddedData["ND_"+this.tableKeys[i]],name:this.newlyAddedData[this.tableKeys[i]]}]
          this.dataConfig[this.tableKeys[i]].searchItems = this.sortPipe.transform(this.uniqueKeyPipe.transform([...tempData, ...this.dataConfig[this.tableKeys[i]].searchItems], 'id'), 'name');
        } else {
          this.newlyAddedData[this.tableKeys[i]] = this.newlyAddedData["ND_" + this.tableKeys[i]]
        }
      }
      this.alltableData.unshift(this.newlyAddedData);
      if(this.tableData?.rules?.length){
        this.tableData?.rules?.unshift(this.newlyAddedData)
      } else{
        this.tableData.rules = []
        this.tableData?.rules?.push(this.newlyAddedData)
      }
      this.addRecordClose()
      this.loader.hide()
    }
  }
  onPaginationClick(event, alltableData) {
    this.loader.show()
    if(event >= 0){
      if (this.filterApplied) {
        alltableData = this.allFilteredData
      }
      this.currentPage = event;
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      if (alltableData) {
        this.tableData.rules = alltableData.slice(startIndex, endIndex);
        if(!this.tableData.rules.length){
          this.onPaginationClick((this.currentPage - 1),this.alltableData)
        }
      }
      this.pageCount()
    }
      this.loader.hide()
  }
  onSearchChange(event, key, pageNo?) {
    this.loader.show();
    pageNo = pageNo ? pageNo : 1
    this.dataConfig[key].searchParams = event
    let searchKeys = Object.keys(this.dataConfig)
    this.allFilteredData = this.alltableData

    this.filterApplied = false;
    // logic: loop through all searchdata and start with first to reduce results
    for (let i = 0; i < searchKeys.length; i++) {
      if (this.dataConfig[searchKeys[i]].searchParams) {
        this.filterApplied = true;
        if (this.dataConfig[searchKeys[i]].fieldType == "DROPDOWN") {
          let searchableValues = this.dataConfig[searchKeys[i]].searchParams.map(x => x.id)
          this.allFilteredData = searchableValues.length > 0 ? this.allFilteredData.filter(x => searchableValues.includes(x["ND_" + searchKeys[i]])) : this.allFilteredData
        } else if (this.dataConfig[searchKeys[i]].fieldType == "NUMBER") {
          let searchableValues = this.dataConfig[searchKeys[i]].searchParams
          this.allFilteredData = searchableValues ? this.allFilteredData.filter(x => Number(x["ND_" + searchKeys[i]]) == Number(searchableValues)) : this.allFilteredData
        }else if  (this.dataConfig[searchKeys[i]].fieldType == "STR") {
          let searchableValues = this.dataConfig[searchKeys[i]].searchParams
          this.allFilteredData = searchableValues ? this.allFilteredData.filter(x => x["ND_" + searchKeys[i]].includes(searchableValues)) : this.allFilteredData
        }
      }
    }
    this.loader.hide();
    this.onPaginationClick(pageNo, this.allFilteredData)
  }



  downloadAttachment(data) {
    this.loader.show();
    const link = document.createElement('a');
    if (data) {
      link.href = data;
    }
    else {
      this.alert.error('File Not Found.', {});
    }
    link.dispatchEvent(new MouseEvent('click'));
    this.loader.hide();
  }

  uploadDocument(event) {
    this.loader.show();
    this.UploadButtonText = 'Uploading Rule File'
    const formData = new FormData()
    formData.append('file', event.target?.files[0])
    formData.append('eventSlug', this.ruleData?.ruleEvent?.slug)
    formData.append('programId', this.programId)
    formData.append('moduleId', this.ruleData?.moduleId)
    formData.append('ruleId', this.ruleData?.id)

    this.programService.post(`/rule-engine/upload-decision-table`, formData).subscribe({
      next: (rule: any) => {
        if (rule && rule?.fileDTO?.createdAt) {
          this.alert.success('Rule has been created successfully');
          if (rule?.rulesJson) {
            this.tableData = JSON.parse(rule?.rulesJson);
            this.tableKeys = Object.keys(this.tableData?.rules[0]);
            this.alltableData = this.tableData?.rules
            this.onPaginationClick(1, this.alltableData)
            this.getRuleDetails()
          }
          this.UploadButtonText = 'Upload Rule File'
        } else if (rule && rule?.uploadResponseMessage) {
          this.UploadButtonText = 'Upload Rule File'
          this.underProcess = true
          this.ruleData.fileSubmissionStatus = { reason: '' }
          this.ruleData.fileSubmissionStatus.reason = rule?.uploadResponseMessage
          this.onPaginationClick(1, this.alltableData)
          this.getRuleDetails()
        }
          this.loader.hide();
      },
      error: (err: any) => {
        this.loader.hide();
        this.alert.error(err.error?.error?.message ? err.error?.error?.message : err.error?.message, {})
        this.UploadButtonText = 'Upload Rule File'
      }
    })
  }

  onDataChange(event, selectedKey, row) {
    this.loader.show();
    let index = this.alltableData?.findIndex(x => x?.sequence == row.sequence)
    if(event){
      this.alltableData[index][selectedKey] = event.name
      this.alltableData[index]["ND_" + selectedKey] = event.id
    }
    this.alltableData[index].actionFlag = this.alltableData[index].actionFlag == "New" ? "New" : "Changed"
    this.loader.hide();
  }


  getTableData(selectedIndex) {
    let index = this.alltableData?.findIndex(x => x?.sequence == selectedIndex)
    this.alltableData[index].actionFlag = this.alltableData[index].actionFlag == "New" ? "New" : "Changed"

  }
  editModeClicked() {
    this.editMode = true;

  }
  cancelClicked() {
    this.editMode = false;
    this.cancelWarningModal = false;
    this.getRuleDetails();
  }

  cancelWarning(event) {
    if (event) {
      this.cancelWarningModal = true;
    }
  }
  goBackWarning(event) {
    if (event) {
      this.goBackWarningModal = true;
    }
  }
  cancelWarningClose() {
    this.cancelWarningModal = false;
  }
  goBackWarningClose() {
    this.goBackWarningModal = false;
  }

  addRecord(event) {
    if (event) {
      this.addRecordModal = true;
    }
  }
  addRecordClose() {
    this.addRecordModal = false;
    this.newlyAddedData = {}
  }

  removeRecord(event, index) {
    if (event) {
      this.removeIndex = index;
      this.removeRecordModal = true;
    }
  }
  removeFromTable() {
    if (this.removeIndex >= 0) {
      let index = this.alltableData?.findIndex(x => x?.sequence == this.removeIndex)
      this.alltableData.splice(index, 1)
      this.onPaginationClick(this.currentPage, this.alltableData)
      this.removeRecordClose()
    }
  }
  removeRecordClose() {
    this.removeIndex = -1;
    this.removeRecordModal = false;
  }
  saveFile() {
    //this.universalData.length > 0 ? this.universalData?.forEach(x => { delete x.editMode }) : this.alltableData?.forEach(x => { delete x.editMode })
    this.loader.show();
    const nullFlag = this.alltableData.some(item =>
      Object.keys(item).some(key =>
        key.startsWith("ND") && (item[key] === null || item[key] === "" || item[key] === undefined || item[key] === false)
      )
    );
    if (nullFlag) {
      this.loader.hide();
      this.alert.error('Please fill all data', {});
    } else {

      //for changed data we are not getting actual Text in other fields, so looping through changed data only to get text of dropdown
      for (let i = 0; i < this.alltableData.length; i++) {
        for (let j = 0; j < this.tableKeys.length; j++) {
          if(this.dataConfig[this.tableKeys[j]].fieldType == "NUMBER"){
            this.alltableData[i]["ND_" + this.tableKeys[j]] = Number(this.alltableData[i]["ND_" + this.tableKeys[j]])
            this.alltableData[i][this.tableKeys[j]] = this.alltableData[i]["ND_" + this.tableKeys[j]]
          }else if(this.dataConfig[this.tableKeys[j]].fieldType == "STR"){
            this.alltableData[i][this.tableKeys[j]] = this.alltableData[i]["ND_" + this.tableKeys[j]]
          }
        }
      }
      let changedData = this.alltableData.filter(f => f.actionFlag == "Changed")
      for (let i = 0; i < changedData.length; i++) {
        let index = this.alltableData?.findIndex(x => x?.sequence == changedData[i].sequence)
        for (let j = 0; j < this.tableKeys.length; j++) {
          if (this.dataConfig[this.tableKeys[j]].fieldType == "DROPDOWN") {
            this.alltableData[index][this.tableKeys[j]] = this.dataConfig[this.tableKeys[j]].items.filter(f => f.id == this.alltableData[index]["ND_" + this.tableKeys[j]])[0].name
          } else if(this.dataConfig[this.tableKeys[j]].fieldType == "NUMBER"){
            this.alltableData[index]["ND_" + this.tableKeys[j]] = Number(this.alltableData[index]["ND_" + this.tableKeys[j]])
            this.alltableData[index][this.tableKeys[j]] = this.alltableData[index]["ND_" + this.tableKeys[j]]
          }else  {
            this.alltableData[index][this.tableKeys[j]] = this.alltableData[index]["ND_" + this.tableKeys[j]]
          }
        }

      }

      this.alltableData = this.alltableData.map(obj => {
        // Create a new object to store the filtered properties
        const filteredObj = {};
        // Iterate through the keys of the original object
        for (const key in obj) {
          // Check if the key is not "sequence" and does not contain "loading"
          if (key !== "sequence" && !key.includes("Loading")) {
            // Add the key and its value to the filtered object
            filteredObj[key] = obj[key];
          }
        }
        return filteredObj;
      });

      let payload = {
        ruleId: this.ruleId,
        programId: this.programId,
        moduleId: this.ruleData?.moduleId,
        eventSlug: this.ruleData?.ruleEvent?.slug,
        rulesJson: { rules: this.alltableData }
      }

      this.programService.post(`/rule-engine/modify-decision-table`, payload).subscribe({
        next: (rule: any) => {
            this.loader.hide();
          if (rule?.rulesJson) {
            this.alert.success('Rule file updated successfully.')
          } else if (rule?.uploadResponseMessage) {
            this.alert.success(rule?.uploadResponseMessage)
            this.getRuleDetails()
          }
        },
        error: (err: any) => {
          this.loader.hide();
          this.alert.error(err.error?.error?.message ? err.error?.error?.message : err.error?.message, {})
          this.getRuleDetails();
        }
      })
      this.editMode = false;
    }
  }


  searchValues(event, selectedKey, rowData) {
    if (this.dataConfig[selectedKey].items.length < this.dataConfig[selectedKey].totalRecords && event) {
      rowData[selectedKey + "Loading"] = true
      let keyName = this.dataConfig[selectedKey].fieldMeta?.outer_key;
      let idArray = this.dataConfig[selectedKey].fieldMeta?.display_key_map.id;
      let nameArray = this.dataConfig[selectedKey].fieldMeta?.display_key_map.name;
      let url = this.dataConfig[selectedKey].apiURL;
      if ((event || event == '') && url.includes('?')) {
        this.dataConfig[selectedKey].fieldMeta?.filter_param ? url += `&${this.dataConfig[selectedKey].fieldMeta?.filter_param}=${event}` : url += `&k=${event}`;
      } else if ((event || event == '') && !url.includes('?')) {
        this.dataConfig[selectedKey].fieldMeta?.filter_param ? url += `?${this.dataConfig[selectedKey].fieldMeta?.filter_param}=${event}` : url += `?k=${event}`;
      }
      this.programService.get(url).subscribe(
        {
          next: (data: any) => {
            rowData[selectedKey + "Loading"] = false
            for (let i = 0; i < keyName.length; i++) {
              data = data[keyName[i]]
            }
            data = this.getArrangedData(data, idArray, nameArray)
            this.dataConfig[selectedKey].items = this.uniqueKeyPipe.transform([...data, ...this.dataConfig[selectedKey].items], 'id');

          }
        });
    }
  }

  addNewDataSearchValues(event, selectedKey) {
    if (this.dataConfig[selectedKey].items.length < this.dataConfig[selectedKey].totalRecords && event) {
      this.newlyAddedData[selectedKey + "Loading"] = true
      let keyName = this.dataConfig[selectedKey].fieldMeta?.outer_key;
      let idArray = this.dataConfig[selectedKey].fieldMeta?.display_key_map.id;
      let nameArray = this.dataConfig[selectedKey].fieldMeta?.display_key_map.name;
      let url = this.dataConfig[selectedKey].apiURL;
      if ((event || event == '') && url.includes('?')) {
        this.dataConfig[selectedKey].fieldMeta?.filter_param ? url += `&${this.dataConfig[selectedKey].fieldMeta?.filter_param}=${event}` : url += `&k=${event}`;
      } else if ((event || event == '') && !url.includes('?')) {
        this.dataConfig[selectedKey].fieldMeta?.filter_param ? url += `?${this.dataConfig[selectedKey].fieldMeta?.filter_param}=${event}` : url += `?k=${event}`;
      }
      this.programService.get(url).subscribe(
        {
          next: (data: any) => {
            this.newlyAddedData[selectedKey + "Loading"] = false
            for (let i = 0; i < keyName.length; i++) {
              data = data[keyName[i]]
            }
            data = this.getArrangedData(data, idArray, nameArray)
            this.dataConfig[selectedKey].items = this.uniqueKeyPipe.transform([...data, ...this.dataConfig[selectedKey].items], 'id');
          }
        });
    }
  }

  getArrangedData(data, idarray, namearray) {
    let mappeddata = []
    for (let i = 0; i < idarray.length; i++) {
      if (i == 0) {
        mappeddata = data?.map(x => {
          x["finalid"] = x[idarray[i]];
          return x
        })
      } else {
        mappeddata = data?.map(x => {
          x["finalid"] = x["finalid"][idarray[i]];
          return x
        })
      }
    }
    for (let i = 0; i < namearray.length; i++) {
      if (i == 0) {
        mappeddata = data?.map(x => {
          x["finalname"] = x[namearray[i]];
          return x
        })
      } else {
        mappeddata = data?.map(x => {
          x["finalname"] = x["finalname"][namearray[i]];
          return x
        })
      }
    }
    const result = mappeddata?.map((x) => ({ id: x.finalid, name: Array.isArray(x.finalname) ? x.finalname[0] : x.finalname }))
    return this.sortPipe.transform(result, 'name')
  }

  preventEqualtoCharacters(event) {
    var charCode = (event.which) ? event.which : event.keyCode;

    // Allow all characters except '='
    if (charCode === 61) { // 61 is the character code for '='
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }


  preventCharacters(event) {
    var charCode = (event.which) ? event.which : event.keyCode;
    // Only Numbers 0-9 & .
    if ((charCode < 48 || charCode > 57) && charCode != 46) {
      event.preventDefault();
      return false;
    } else {
      return true;
    }
  }

  getRuleDetails() {
    this.loader.show();
    this.programService.get(`/rule-engine/rule-detail/${this.ruleId}`)
      .subscribe(
        {
          next: (rule: any) => {
            this.ruleData = rule.ruleDetails;
            this.ruleData.updateAt = (new Date(this.ruleData.updateAt)).getTime();
            this.ruleData.createdAt = (new Date(this.ruleData.createdAt)).getTime();
            this.ruleData.effectiveStartDate = this.ruleData?.effectiveStartDate ? this.localDataTime.transform(new Date(this.ruleData?.effectiveStartDate), this.dateFormat) : '';
            this.ruleData.effectiveEndDate = this.ruleData?.effectiveEndDate ? this.localDataTime.transform(new Date(this.ruleData?.effectiveEndDate), this.dateFormat) : '';
            this.ruleData.status = this.ruleData?.enabled ? 'Active' : 'Inactive'
            if (new Date(this.ruleData?.effectiveEndDate) < new Date()) {
              this.ruleData.status = 'Expired'
            }
            this.ruleData.ruleInitialTriggerConditions = this.sortPipe.transform(this.ruleData?.ruleInitialTriggerConditions, 'placementOrder');
            this.ruleData.decisionTableTemplate = rule.ruleDetails.decisionTableRuleFiles.filter(objFile => objFile.dtFileType == 'TEMPLATE')[0]
            this.ruleData.dtFile = rule.ruleDetails.decisionTableRuleFiles.filter(objFile => objFile.dtFileType == 'DT')[0]
            this.outputColumns = this.ruleData?.ruleOutputs ? this.ruleData?.ruleOutputs?.map(x => x.outputHeaderName) : [];
            // this.ruleData.ruleOutputs = this.ruleData?.ruleOutputs ?  this.ruleData?.ruleOutputs?.map(x => x.ruleFieldConfig) : [];
            this.tableData = JSON.parse(this.ruleData?.rulesJson) || {};
            //pagination, searching is internal so added sequence key with increment number
            this.tableData.rules = this.tableData?.rules?.map((obj, index) => {
              return {
                sequence: index,
                ...obj
              };
            });
            this.alltableData = this.tableData?.rules || []
            this.dataConfig = {}
            // generate dataconfig so can be used to show table and add new data modal
            this.ruleData.ruleInputs.forEach(element => {
              this.dataConfig[element.conditionHeaderName] = {
                ruleType: "input",
                fieldMeta: element?.ruleFieldConfig?.ruleField?.fieldMeta?.rendering,
                fieldType: element?.ruleFieldConfig?.ruleField?.fieldType?.fieldType,
                apiURL: element.ruleFieldConfig.ruleField.dataSource.apiURL.replace('{program_id}', this.programId),
                items: this.uniqueKeyPipe.transform([{ id: "*", name: "*" }, ...this.alltableData.map(x => {
                  return {
                    id: x["ND_" + element.conditionHeaderName],
                    name: x[element.conditionHeaderName]
                  }
                })], 'id'),
                searchItems: this.uniqueKeyPipe.transform([{ id: "*", name: "*" }, ...this.alltableData.map(x => {
                  return {
                    id: x["ND_" + element.conditionHeaderName],
                    name: x[element.conditionHeaderName]
                  }
                })], 'id'),
                isAccuracyDependent:element?.ruleFieldConfig.config?.isAccuracyDependent,
                accuracyKey:element?.ruleFieldConfig.config?.accuracyKey,
              }
            });

            this.ruleData.ruleOutputs.forEach(element => {
              this.dataConfig[element.outputHeaderName] = {
                ruleType: "output",
                fieldMeta: element?.ruleFieldConfig?.ruleField?.fieldMeta?.rendering,
                fieldType: element?.ruleFieldConfig?.ruleField?.fieldType?.fieldType,
                apiURL: element.ruleFieldConfig.ruleField.dataSource.apiURL.replace('{program_id}', this.programId),
                items: this.uniqueKeyPipe.transform([{ id: "*", name: "*" }, ...this.alltableData.map(x => {
                  return {
                    id: x["ND_" + element.outputHeaderName],
                    name: x[element.outputHeaderName]
                  }
                })], 'id'),
                searchItems: this.uniqueKeyPipe.transform([{ id: "*", name: "*" }, ...this.alltableData.map(x => {
                  return {
                    id: x["ND_" + element.outputHeaderName],
                    name: x[element.outputHeaderName]
                  }
                })], 'id'),
                isAccuracyDependent:element?.ruleFieldConfig.config?.isAccuracyDependent,
                accuracyKey:element?.ruleFieldConfig.config?.accuracyKey,
              }
            });

            this.tableKeys = Object.keys(this.dataConfig) || []
            if (rule.ruleDetails.decisionTableRuleFiles.filter(objFile => objFile.dtFileType == 'DT_FAILED').length > 0 && rule.ruleDetails?.fileSubmissionStatus?.fileUploadStatus == 'FAILED') {
              this.underProcess = false
              this.disabledDownloadButton = true
              this.tableData = {}
              this.ruleData.fileSubmissionStatus = rule.ruleDetails.fileSubmissionStatus
              this.ruleData.failedDecisionTableFile = rule.ruleDetails.decisionTableRuleFiles.filter(objFile => objFile.dtFileType == 'DT_FAILED')[0]
            }
            else if (rule.ruleDetails?.fileSubmissionStatus?.fileUploadStatus == 'PROCESSING') {
              this.UploadButtonText = 'Upload Rule File'
              this.underProcess = true
              this.tableData = {}
              this.ruleData.fileSubmissionStatus.reason = rule.ruleDetails?.fileSubmissionStatus?.reason
            }
            else if (this.ruleData?.rulesJson || this.tableKeys) {
              this.underProcess = false
              let dataConfigKeys = Object.keys(this.dataConfig)

              for (let i = 0; i < dataConfigKeys.length; i++) {
                if (this.dataConfig[dataConfigKeys[i]].fieldType == "DROPDOWN") {
                    let keyName = this.dataConfig[dataConfigKeys[i]].fieldMeta?.outer_key;
                    let idArray = this.dataConfig[dataConfigKeys[i]].fieldMeta?.display_key_map.id;
                    let nameArray = this.dataConfig[dataConfigKeys[i]].fieldMeta?.display_key_map.name;
                    this.programService.get(this.dataConfig[dataConfigKeys[i]].apiURL).subscribe(
                     {
                      next: (data: any) => {
                        this.dataConfig[dataConfigKeys[i]].totalRecords = data.total_records
                        for (let i = 0; i < keyName.length; i++) {
                          data = data[keyName[i]]
                        }
                        if(this.dataConfig[dataConfigKeys[i]].apiURL.includes('unit_of_measure')){
                          data= data.filter(f=>f?.is_enabled == true)
                          data = this.getArrangedData(data, idArray, nameArray)
                          data = data?.map((entry: any) => {
                            return {
                              id: entry.id.toLowerCase(),
                              name: entry.name.toUpperCase()
                            };
                          })
                        }
                        else if (this.dataConfig[dataConfigKeys[i]].apiURL.includes('hierarchy')) {
                           data = this.ruleData?.hierarchies.filter(f=>f?.name!=null)

                        } else {
                          data = this.getArrangedData(data, idArray, nameArray)
                        }
                        this.dataConfig[dataConfigKeys[i]].items = [...this.dataConfig[dataConfigKeys[i]].items, ...data]
                        this.dataConfig[dataConfigKeys[i]].items = this.sortPipe.transform(this.uniqueKeyPipe.transform(this.dataConfig[dataConfigKeys[i]].items, 'id'), 'name');
                      }
                     });

                }
              }
              if (rule.ruleDetails.decisionTableRuleFiles.filter(objFile => objFile.dtFileType == 'DT').length > 0) {
                this.downloadButtonText = 'Download Rule File'
                this.ruleData.decisionTableTemplate = rule.ruleDetails.decisionTableRuleFiles.filter(objFile => objFile.dtFileType == 'DT')[0]
              }
              this.onPaginationClick(1, this.alltableData)
            }

            this.details = [{
              label: "ID",
              value: this.ruleData?.ruleCode,
              displayType: 'text'
            }, {
              label: "Status",
              value: this.ruleData?.status,
              displayType: 'status',
              enabled: this.ruleData?.enabled
            }, {
              label: "Module",
              value: this.ruleData?.moduleName,
              displayType: 'text'
            }, {
              label: "Event",
              value: this.ruleData?.ruleEvent?.name,
              displayType: 'text'
            }, {
              label: "Rule Type",
              value: this.ruleData?.ruleType,
              displayType: 'text'
            }, {
              label: "Effective Date",
              value: this.ruleData?.effectiveStartDate + (this.ruleData?.effectiveEndDate ? ' - ' + this.ruleData?.effectiveEndDate : ''),
              displayType: 'text'
            },
            {
              label: "Hierarchy",
              value: this.ruleData?.hierarchies.filter(f=>f?.name !=null),
              displayType: 'box-view'
            },
            {
              label: "Iutput Based On",
              value: this.ruleData?.ruleInputs ? this.ruleData?.ruleInputs?.map(x => x.ruleFieldConfig) : [],
              displayType: 'box-view'
            },
            {
              label: "Output Based On",
              value: this.ruleData?.ruleOutputs ? this.ruleData?.ruleOutputs?.map(x => x.ruleFieldConfig) : [],
              displayType: 'box-view'
            }
            ]

            this.loader.hide();
          },
          error: (err: any) => {
            this.alert.error(err.error?.error?.message ? err.error?.error?.message : err.error?.message, {})
            this.loader.hide();
          }
        })
  }

}
