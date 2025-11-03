import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';

@Component({
  selector: 'hierarchy-child-renderer',
  templateUrl: './hierarchy-child-renderer.component.html',
  styleUrls: ['./hierarchy-child-renderer.component.scss']
})
export class HierarchyChildRendererComponent implements OnInit {
  @Input() isReadMode = false;
  @Input() isUserOnly = false;
  @Input() childRenderData;
  @Input() parentCheckboxState = false;
  @Input() selectedTreeArr: string[];
  @Output() selectHierarchyLevel = new EventEmitter();

  checkboxState = false;
  constructor(
    private _alert: AlertService,
    private _changeDetectorRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

  }
  ngOnChanges(changes: SimpleChanges): void {
    this._changeDetectorRef.detectChanges()
    this.checkboxState = false; // if there is no selected arr then set checkboxes as false
    // on edit, set ids as selected
    if (this.selectedTreeArr?.length > 0) {
      this.selectedTreeArr.forEach(id => {
        if (this.childRenderData.id == id) {
          this.checkboxState = true;
        }
      })
    }
  }

  onSelectLevel(event) {
    if (!this.checkboxState && (this.childRenderData.hierarchies.length > 0)) {
      this._alert.warn(`Hierarchies under the selected hierarchy level is active.`);
    }
    this.selectHierarchyLevel.emit({ levelData: this.childRenderData, currentState: this.checkboxState });
  }
  selectParent(event) {
    this.selectHierarchyLevel.emit(event);
  }

}