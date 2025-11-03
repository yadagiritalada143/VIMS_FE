import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TreeColumnConfig } from '../../tree.model';

@Component({
  selector: 'app-tree-node',
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss']
})
export class TreeNodeComponent implements OnInit {
  childVisibility = true;
  @Output() disableClicked = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();
  @Input() vmsTreeNode;
  @Input() vmstreeConfig;
  @Input() flattednedHierarchy: any;
  @Input() viewBlock: boolean = true;
  showdropdown = false;
  constructor(
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void {
  }
  toggleChild() {
    this.childVisibility = !this.childVisibility;
  }

  onClickaddSubLevel(vmsNode?) {
    vmsNode = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == vmsNode.id);
    this.eventStream.emit(new EmitEvent(Events.CREATE_HIERARCHY, vmsNode));

  }
  onViewClick(ev, vmsNode?) {
    vmsNode = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == vmsNode.id);
    this.eventStream.emit(new EmitEvent(Events.VIEW_HIERARCHY, vmsNode));
  }
  onEditClick(evt, vmsNode) {
    vmsNode = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == vmsNode.id);
    this.eventStream.emit(new EmitEvent(Events.EDIT_HIERARCHY, vmsNode));
  }
  showOptionDropdown() {
    this.showdropdown = true;
  }

  hideOptionDropdown() {
    this.showdropdown = false;
  }
  onDisableClick(vmsNodeData) {
    if (vmsNodeData) {
      this.disableClicked.emit(vmsNodeData);
    }
  }
  onDeleteClick(vmsNodeData) {
    if (vmsNodeData) {
      this.deleteClicked.emit(vmsNodeData);
    }
  }

  navItemsAllowed(node: TreeColumnConfig) {
    return (node?.isView || node?.isCreate || node?.isEdit || node?.isDisable || node?.isDelete); 
  }
}
