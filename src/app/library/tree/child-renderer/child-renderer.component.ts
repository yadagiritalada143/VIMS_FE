import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-child-renderer',
  templateUrl: './child-renderer.component.html',
  styleUrls: ['./child-renderer.component.scss']
})
export class ChildRendererComponent implements OnInit {
  @Input() childRenderData;
  @Input() parentCheckboxState = false;
  @Input() selectedTreeArr;
  @Output() selectHierarchyLevel = new EventEmitter();

  checkboxState = false;
  constructor(
    private _alert :AlertService
  ) { }

  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void{
    this.checkboxState = false; // if there is no selected arr then set checkboxes as false
    // on edit, set ids as selected
    if(this.selectedTreeArr?.length){
      for (let i = 0; i < this.selectedTreeArr.length; i++) {
        if(this.childRenderData.id == this.selectedTreeArr[i]){
          this.checkboxState = true;
        }        
      }
    }
    
  }
  onSelectLevel(){
    if(!this.checkboxState && this.childRenderData.hierarchies.length){
      this._alert.warn(`Hierarchies under the selected hierarchy level is active.`);
    }
    this.selectHierarchyLevel.emit({levelData:this.childRenderData, currentState: this.checkboxState});
  }
  selectParent(event){
    this.selectHierarchyLevel.emit(event);
  }

}
