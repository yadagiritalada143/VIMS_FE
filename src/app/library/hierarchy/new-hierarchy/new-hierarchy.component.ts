import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { StorageService, StorageKeys } from 'src/app/core/services/storage.service';
import { Hierarchy } from '../hierarchy.model';

@Component({
  selector: 'svms-new-hierarchy',
  templateUrl: './new-hierarchy.component.html',
  styleUrls: ['./new-hierarchy.component.scss']
})
export class NewHierarchyComponent implements OnInit {
  @Input() isReadMode = false;
  @Input() isUserOnly = false;
  @Input() hierarchyData: Hierarchy[];
  @Input() selectedHierarchy: string[] = [];
  @Input() userAssociatedHierarchyID: string[] = [];
  @Input() isCreateEditJob = false;
  @Input() hierarchyDropdown: Hierarchy[];
  @Input() dataVisibility:string='visible'; 

  @Output() selectHierarchyLevel = new EventEmitter();
  @Output() sidebarClosed= new EventEmitter();
  parentCheckboxState = [];
  lastNode: any;
  hierarchyToggle = true;
  selectHierarchyId: string;

  constructor(private localStorage: StorageService) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    this.selectHierarchyId=this.selectedHierarchy?.[0];
    this.hierarchyData.forEach(data => {
      if (this.selectedHierarchy?.length > 0) {
        if (this.selectedHierarchy.indexOf(data?.id) > -1) {
          this.parentCheckboxState[data.id] = true;
        } else {
          this.parentCheckboxState[data.id] = false;
        }
      } else {
        this.parentCheckboxState[data.id] = false;
      }
    });
  }

  selectHierarchy(hierarchy: Hierarchy, remove = false) {
    this.selectHierarchyId = hierarchy?.id;
    if (!this.isUserOnly) {
      if (!remove) {
        if (!this.selectedHierarchy?.includes(hierarchy?.id)) {
          this.selectedHierarchy?.push(hierarchy?.id);
        }
      } else {
        if (this.selectedHierarchy?.includes(hierarchy?.id)) {
          this.selectedHierarchy?.splice(this.selectedHierarchy?.indexOf(hierarchy?.id), 1);
        }
      }
    } else {
      this.selectedHierarchy = [];
      if (hierarchy?.id in this.parentCheckboxState) {
        this.hierarchyData.forEach(data => {
          this.parentCheckboxState[data?.id] = false;
        });
        this.parentCheckboxState[hierarchy?.id] = true;
      } else {
        this.hierarchyData.forEach(data => {
          this.parentCheckboxState[data?.id] = false;
        });
      }
      if (!remove) {
        this.selectedHierarchy.push(hierarchy?.id);
      }
    }
    if (hierarchy?.hierarchies?.length > 0 && !this.isUserOnly) {
      hierarchy?.hierarchies?.forEach(data => {
        if (!remove) {
          this.selectHierarchy(data);
        }
      });
    }
  }

  onSelectLevel(index: number, id: string , isDisabled?:boolean) {
    if(isDisabled) return;
    this.selectHierarchyId=id;
    this.toggleCheckboxState(id);
    if (this.parentCheckboxState[id]) {
      this.selectHierarchy(this.hierarchyData[index]);
    }
    if (!this.parentCheckboxState[id]) {
      this.selectHierarchy(this.hierarchyData[index], true);
    }
  }

  selectParent(event) {
    this.selectHierarchy(event?.levelData, !event?.currentState);
  }

  checkDisabled(id: string) {
    if (this.isReadMode) {
      return true;
    } else if (this.isUserOnly) {
      if (this.isCreateEditJob && this.localStorage.get(StorageKeys.USER_TYPE)?.toUpperCase() === 'MSP') {
        return false;
      }
      if (this.userAssociatedHierarchyID.indexOf(id) > -1 || !this.hierarchyData.find(e => e.id === id)?.hierarchies?.length) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  childHierarchy(){
    this.hierarchyToggle = !this.hierarchyToggle;
    
  }
  toggleCheckboxState(id){
    this.parentCheckboxState=[];
    this.parentCheckboxState[id]=true;
  }

  dropdownSelect(event: Hierarchy){
   if(event){
      this.toggleCheckboxState(event?.id);
      if(this.parentCheckboxState[event?.id]){
        this.selectHierarchy(event);
      }
      else{
        this.selectHierarchy(event, true);
      }
    }
    }

  clearHierarchy(){
    this.selectedHierarchy=[];
    this.parentCheckboxState=[];
    this.hierarchyToggle=true;
  }

  onContinueClicked(){
    this.selectHierarchyLevel.emit(this.selectedHierarchy);
  }

  onCloseClicked(){
    this.sidebarClosed.emit();
    this.selectHierarchyId=this.selectedHierarchy?.[0] ?? '';
  }

}
