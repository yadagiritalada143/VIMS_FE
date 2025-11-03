import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { UpdateFormRenderModel } from './form-renderer.model';
import { FormRendererService } from './form-renderer.service';

@Component({
  selector: 'app-form-renderer',
  templateUrl: './form-renderer.component.html',
  styleUrls: ['./form-renderer.component.scss']
})
export class FormRendererComponent implements OnInit {

  config: any;
  @Input('configUrl') configUrl;
  @Input() is_review_need = false;
  @Input() review_page_label = 'Review & Save'
  @Input() is_update = false
  @Input() updateValue: any;
  @Input() candidateId: string;
  @Input() is_back_btn = false;
  @Input() isSaveLoader: boolean;
  @Input() back_btn_name = 'Back';
  @Input() assignmentId: string;
  updateConfig: UpdateFormRenderModel[] = [];

  @Output() onCreateClick = new EventEmitter()
  @Output() onSubmit = new EventEmitter()
  @Output() onBackBtnClick = new EventEmitter()
  @Output() onReviewClick = new EventEmitter()

  @Output() onClickCandidateView = new EventEmitter();
  @Output() onClickVendorView = new EventEmitter();
  @Output() onClickBack = new EventEmitter();

  @ViewChild('form_render_tab') renderTabHead: ElementRef;

  public finalUpdateData = {}
  updateProcess = false

  constructor(private _formRendererService: FormRendererService,
    private _loader: LoaderService) {
  }

  ngOnInit() {
    if (this.configUrl) {
      this._loader.show()
      this._formRendererService.getConfigJson(this.configUrl).subscribe((data: any) => {
        if (this.is_update) {
          data.data.form_config.title = 'Update Assignment';
          data.data.form_config.config.nav_tabs[0].is_visible = false;
          data.data.form_config.config.nav_tabs.forEach((tab, index) => {
            if (!tab?.is_visible) {
              data.data.form_config.config.nav_tabs.splice(index, 1)
            }
          })
        }
        this.config = data?.data?.form_config;
        if (this.is_review_need) {
          this.config?.config?.nav_tabs.push(
            {
              label: this.review_page_label,
              field_groups: []
            }
          )
        }
        if (this.is_update) {
          for (var tab of this.config.config.nav_tabs) {
            for (var group of tab.field_groups) {
              for (var field of group.fields) {
                if (field.group_type) {
                  if ((field.group_type === 'ARRAY') || (field.group_type === 'FOOTER_ARRAY')) {
                    for (var arrayobj of field.fields) {
                      const fieldData = this.getDataByKey(this.updateValue, arrayobj.id);
                      if (typeof fieldData === 'object') {
                        if(!Array.isArray(fieldData)) {
                          this.updateConfig.push({ fieldName: arrayobj.slug, value: fieldData?.id, label: fieldData?.name });
                        } else if(Array.isArray(fieldData)) {
                          this.updateConfig.push({ fieldName: arrayobj.slug, value: fieldData?.map(d => d.id), label: fieldData?.map(d => d.name) });
                        }
                        
                      } else {
                        this.updateConfig.push({ fieldName: arrayobj.slug, value: fieldData ? fieldData : null });
                      }
                    }
                  } else if ((field.group_type === "TABLE") || (field.group_type === "DISPLAY_TABLE")) {
                    if (group.id === 'taxes' || group.id === 'fees') {
                      for (var { tabelement } of field.row.map((tabelement, index) => ({ tabelement, index }))) {
                        const fieldData = this.getDataByKey(this.updateValue, 'tax');
                        for (var taxdata of fieldData) {
                          const rowIndex = field?.fields.findIndex((fieldArr: any[]) => {
                            return fieldArr.some(ele => ele?.slug === taxdata?.entity_name)
                          });
                          if (rowIndex > -1) {
                            for (var col of field?.fields[rowIndex]) {
                              if (col?.id === 'types') {
                                this.updateConfig.push({ fieldName: col?.slug, value: taxdata?.amount_type })
                              }
                              if (col?.id === 'value') {
                                this.updateConfig.push({ fieldName: col?.slug, value: taxdata?.amount_value })
                              }
                              if (col?.id === 'applicable_on') {
                                this.updateConfig.push({ fieldName: col?.slug, value: taxdata?.applicable_on })
                              }
                            }
                          }
                        }
                        // for (let col of field?.fields[index]) {
                        //   const fieldData = this.getDataByKey(this.updateValue, 'tax');
                        //   // console.log(':::', col, field?.fields, index);
                        //   for (var taxdata of fieldData) {
                        //     if (col?.slug === taxdata?.entity_name) {
                        //       console.log('::: taxdata', taxdata);
                              
                        //     }
                        //   }
                        //     // console.log(':::', taxdata.entity_name === tabelement.slug, tabelement);
                        //     // if (taxdata.entity_name === tabelement.slug) {
                        //     //   if (col?.id === 'types') {
                        //     //     this.updateConfig.push({ fieldName: col?.slug, value: taxdata?.amount_type })
                        //     //   }
                        //     //   if (col?.id === 'value') {
                        //     //     this.updateConfig.push({ fieldName: col?.slug, value: taxdata?.amount_value })
                        //     //   }
                        //     //   if (col?.id === 'applicable_on') {
                        //     //     this.updateConfig.push({ fieldName: col?.slug, value: taxdata?.applicable_on })
                        //     //   }
                        //     // }
                        //   // }
                        // }
                      }
                    }
                    else {
                      for (var tableobj of field.fields) {
                        for (var tabelement of tableobj) {
                          const fieldData = this.getDataByKey(this.updateValue, tabelement.id);
                          if (typeof fieldData === 'object') {
                            this.updateConfig.push({ fieldName: tabelement.slug, value: fieldData?.id, label: fieldData?.name });
                          } else {
                            this.updateConfig.push({ fieldName: tabelement.slug, value: fieldData ? fieldData : null });
                          }
                        }
                      }
                    }
                  }
                } else {  // plain fields with direct availalable fields
                  const fieldData = this.getDataByKey(this.updateValue, field.id);
                  if (typeof fieldData === 'object') {
                    this.updateConfig.push({ fieldName: field.slug, value: fieldData?.id, label: fieldData?.name });
                  } else {
                    this.updateConfig.push({ fieldName: field.slug, value: fieldData ? fieldData : null });
                  }
                }
              }
            }
          }
        }
        this.updateProcess = true
        this._loader.hide()
      }, err => {
        this._loader.hide()
      });
    }

  }
  getDataByKey(updateData, key: string) {
    if (updateData.hasOwnProperty(key)) return updateData[key];
    else {
      for (let i = 0; i < Object.keys(updateData).length; i++) {
        let value = updateData[Object.keys(updateData)[i]];
        if (typeof value === "object" && value !== null) {
          let result = this.getDataByKey(value, key);
          if (result) {
            return result
          };
        }
      }
    }
  }

  onTabChange(event) {
    this.renderTabHead.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }

  onClickBtn(event) {
    this.onCreateClick.emit(event)
  }

  onContinueClick(event) {
    let tempData = {}
    this.config?.config?.nav_tabs.forEach(tab => {
      let tabData = event[tab?.label].getRawValue()
      if (event?.document) {
        tempData = event?.document
      }
      tempData = { ...tempData, ...tabData } 
    });
    this.onSubmit.emit(tempData)
  }
  onBackClick(event) {
    this.onBackBtnClick.emit(true)
    event.preventDefault()
  }

  reviewData(event) {
    let tempData = {}
    this.config?.config?.nav_tabs.forEach(tab => {
      if (event[tab?.label]) {
        let tabData = event[tab?.label].getRawValue()
        tempData = { ...tempData, ...tabData }
      }
    });
    this.onReviewClick.emit(tempData)
  }

  onCandidateView(event) {
    this.onClickCandidateView.emit(event)
  }

  onVendorClick(event) {
    this.onClickVendorView.emit(event)
  }

  onClickBackBtn() {
    this.onClickBack.emit()
  }

}
