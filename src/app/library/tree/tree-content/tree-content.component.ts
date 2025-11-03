import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { EmitEvent, Events, EventStreamService } from 'src/app/core/services/event-stream.service';
import { TreeColumnConfig, VMSTreeConfig } from '../tree.model';

@Component({
  selector: 'app-tree-content',
  templateUrl: './tree-content.component.html',
  styleUrls: ['./tree-content.component.scss']
})
export class TreeContentComponent implements OnInit {
  @Input() vmsTreeDataSource;
  @Input() flattednedHierarchy;
  @Input() treeConfig: VMSTreeConfig;
  @Input() viewBlock: boolean = true;
  @Output() disableClicked = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();

  fixedHeader = false;
  lastScrollTop = 0;
  showdropdown = false;
  constructor(
    private eventStream: EventStreamService
  ) { }

  ngOnInit(): void {
    window.onscroll = () => {
      let st = window.pageYOffset;
      if (st > this.lastScrollTop) {

        if (st > 110) {
          this.fixedHeader = true;
        }
      } else if (110 < st && st < this.lastScrollTop) {
        this.fixedHeader = true;
      } else if (st <= 110) {
        this.fixedHeader = false;
      }

      this.lastScrollTop = st;
    };
  }

  showOptionDropdown(vmsTreeDataSource) {
    vmsTreeDataSource.active = true;
  }

  hideOptionDropdown(vmsTreeDataSource) {
    vmsTreeDataSource.active = false;
  }

  getDateTime(timestamp?) {
    return timestamp;
  }

  isObject(sorceData?) {
    return typeof (sorceData) === 'object' && sorceData?.length > 0 || false;
  }

  onClickAddSubLevel(event, vmsNode?) {
    vmsNode = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == vmsNode.id);
    this.eventStream.emit(new EmitEvent(Events.CREATE_HIERARCHY, vmsNode));

  }
  onViewClick(evt, vmsNode) {
    vmsNode = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == vmsNode.id);
    this.eventStream.emit(new EmitEvent(Events.VIEW_HIERARCHY, vmsNode));
  }
  onEditClick(evt, vmsNode) {
    vmsNode = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == vmsNode.id);
    this.eventStream.emit(new EmitEvent(Events.EDIT_HIERARCHY, vmsNode));
  }
  onDisableClick(vmsNode) {
    if (vmsNode) {
      this.disableClicked.emit(vmsNode);
    }
  }
  onDeleteClicked(vmsNode) {
    if (vmsNode) {
      this.deleteClicked.emit(vmsNode);
    }
  }

  navItemsAllowed(node: TreeColumnConfig) {
    return (node?.isView || node?.isCreate || node?.isEdit || node?.isDisable || node?.isDelete); 
  }
}
