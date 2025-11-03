import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-permissions',
  templateUrl: './permissions.component.html',
  styleUrls: ['./permissions.component.scss']
})
export class PermissionsComponent {
  public viewMode = false;
  public visibleModuleIndex = 0;

  @Input() permissions = [];
  @Input() moduleGroup: any[] = [];
  @Input() readOnly = false;
  @Output() moduleGroupChange = new EventEmitter<any[]>();
  constructor() { }

  onClickModule(i) {
    this.visibleModuleIndex = i;
  }

  valueChanged(groupIndex, moduleIndex, field) {
    if (field === 'is_enabled' && this.moduleGroup[groupIndex].modules[moduleIndex][field]) {
      this.moduleGroup[groupIndex].modules[moduleIndex] = {
        ...this.moduleGroup[groupIndex].modules[moduleIndex],
        is_read_allowed: false,
        is_create_allowed: false,
        is_edit_allowed: false,
        is_delete_allowed: false
      };
    } else if (this.moduleGroup[groupIndex].modules[moduleIndex][field] &&
      this.moduleGroup[groupIndex].modules[moduleIndex]['is_enabled']) {
      this.moduleGroup[groupIndex].modules[moduleIndex] = {
        ...this.moduleGroup[groupIndex].modules[moduleIndex],
        is_enabled: false
      };
    }
    this.moduleGroup = [... this.moduleGroup];
    this.moduleGroupChange.emit(this.moduleGroup);
  }

}
