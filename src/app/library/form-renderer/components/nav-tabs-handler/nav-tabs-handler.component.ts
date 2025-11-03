import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UpdateFormRenderModel } from '../../form-renderer.model';

@Component({
  selector: 'app-nav-tabs-handler',
  templateUrl: './nav-tabs-handler.component.html',
  styleUrls: ['./nav-tabs-handler.component.scss']
})
export class NavTabsHandlerComponent implements OnInit {

  @Input() jsonData;
  @Input() config;
  @Input() is_review_need = false;
  @Input() is_update = false
  @Input() updateConfig: UpdateFormRenderModel[];
  @Input() updateValue: any;
  @Input() finalUpdateData: any;
  @Input() candidateId: string;
  @Input() isSaveLoader: boolean;
  @Input() assignmentId: string;
  @Output() onBtnClick = new EventEmitter()
  @Output() onContinueClick = new EventEmitter()
  @Output() reviewData = new EventEmitter()
  @Output() onTabChange = new EventEmitter()

  @Output() onClickCandidateView = new EventEmitter();
  @Output() onClickVendorView = new EventEmitter();


  activeTab: any;
  tabIndex = 0;
  constructor() { }

  ngOnInit(): void {
    // this.config[0].visited = true;
    // this.activeTab = this.config[0];
    if(Array.isArray(this.config)){
      for (let tab of this.config) {
        if (tab?.is_visible) {
          this.activeTab = tab
          break;
        }
      }
    }
  }

  tabClicked(tabIndex: number) {
    this.config.forEach((tab, index) => {
      if (index < tabIndex) {
        this.config[index].visited = true
      } else {
        this.config[index].visited = false
      }
    });
    this.tabIndex = tabIndex;
    this.activeTab = this.config[tabIndex];
  }

  onContinue(event) {
    if (event && (this.tabIndex < (this.config.length - 1))) {
      this.tabClicked(this.tabIndex + 1)
    }
    this.onTabChange.emit(true)
    if (this.tabIndex === this.config?.length - 1) {
      this.reviewData.emit(event)
    }
  }

  onClickBtn(event) {
    this.onBtnClick.emit(event)
  }

  onBackBtnClick(event) {
    if (event) {
      this.tabClicked(this.tabIndex - 1)
      this.onTabChange.emit(true)
    }
  }

  onFinalSubmitBtn(event) {
    this.onContinueClick.emit(event)
  }

  onCandidateView(event) {
    this.onClickCandidateView.emit(event)
  }

  onVendorClick(event) {
    this.onClickVendorView.emit(event)
  }

}
