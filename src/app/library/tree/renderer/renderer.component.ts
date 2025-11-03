import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'app-renderer',
  templateUrl: './renderer.component.html',
  styleUrls: ['./renderer.component.scss']
})
export class RendererComponent implements OnInit {
  @Input() renderData;
  @Input() selectedTreeArr;
  @Output() selectHierarchyLevel = new EventEmitter();

  parentCheckboxState = false;
  
  constructor(
    private _alert :AlertService
  ) { }

  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void{
    this.parentCheckboxState = false;
    // on edit 
    if(this.selectedTreeArr?.length){
      for (let i = 0; i < this.selectedTreeArr.length; i++) {
        if(this.renderData.id == this.selectedTreeArr[i]){
          this.parentCheckboxState = true;
        }        
      }
    }
    
  }
  onSelectLevel(){
    if(!this.parentCheckboxState && this.renderData.hierarchies.length){
      this._alert.warn(`Hierarchies under the selected hierarchy level is active.`);
    }
    this.selectHierarchyLevel.emit({levelData:this.renderData, currentState: this.parentCheckboxState});
  }
  selectParent(event){
    this.selectHierarchyLevel.emit(event);
  }
}
