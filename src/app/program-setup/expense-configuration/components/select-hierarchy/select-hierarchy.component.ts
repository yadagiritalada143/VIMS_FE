import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Events,
  EventStreamService,
} from 'src/app/core/services/event-stream.service';

@Component({
  selector: 'app-select-hierarchy',
  templateUrl: './select-hierarchy.component.html',
  styleUrls: ['./select-hierarchy.component.scss'],
})
export class SelectHierarchyComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  @Input() hierarhies = new EventEmitter();
  @Input() userAssociatedHierarchyID: string[] = [];
  @Input() selectedHierarchy: string[];

  @Output() closeSelectHierarchy = new EventEmitter();
  @Output() selectHierarchyIds = new EventEmitter();

  public sidebarVisibility: string;

  private selectedHierarchyIds: string[];

  constructor(
    private eventStreamService: EventStreamService,
  ) {
    this.sidebarVisibility = 'hidden';
  }

  ngOnInit(): void {
    this.subscriptions.push(this.eventStreamService.on(
      Events.CREATE_HIERARCHY).subscribe(
      (data: boolean) => {
        this.sidebarVisibility = data ? 'visible' : 'hidden';
      }
    ));
  }

  public sidebarClose() {
    if (this.selectedHierarchyIds && this.selectedHierarchyIds.length) {
      this.selectHierarchyIds.emit(this.selectedHierarchyIds);
    }
    this.sidebarVisibility = 'hidden';
    this.closeSelectHierarchy.emit();
  }

  public selectHierarchy(event: string[]) {
    this.selectedHierarchyIds = event;
  }

  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
