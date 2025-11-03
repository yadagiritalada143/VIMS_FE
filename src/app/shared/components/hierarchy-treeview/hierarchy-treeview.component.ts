import { AfterViewInit, Component, EventEmitter, Injectable, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { TreeviewItem, TreeviewConfig, TreeviewEventParser, TreeviewComponent, DropdownTreeviewComponent } from 'ngx-treeview';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as _ from 'lodash';
import { interval } from 'rxjs';

export interface TreeNode {
  text: string,
  value: string,
  checked?: boolean,
  children?: Array<TreeNode>,
  disabled?: boolean
};

export interface TreeNodeIterator {
  item: TreeviewItem,
  parent: TreeNodeIterator
};

@Injectable()
class AllCheckedTreeViewParser extends TreeviewEventParser {

  getSelectedChange(component: TreeviewComponent): any[] {
    let items: Array <TreeviewItem> = component?.items;
    return this.getAllChecked(items);
  }

  // DFS based iteration ()
  private getAllChecked(input: Array <TreeviewItem>) {

    let result: Array <string> = [];
    if(!input) {
      return result;
    }

    let iterator: Array <TreeviewItem> = _.cloneDeep(input);
    while(iterator.length) {

      let size: number = iterator.length;
      while(size) {

        const itRef: TreeviewItem = iterator?.[0];
        if(itRef?.['internalChecked']) {
          result.push(itRef?.value);
        }

        let children: Array <TreeviewItem> = itRef?.['internalChildren'] || [];
        if(children.length) {
          iterator.push(...children);
        }

        iterator.shift();
        size--;
      }
    }

    return result;
  }
}

@Component({
  selector: 'hierarchy-treeview',
  templateUrl: './hierarchy-treeview.component.html',
  styleUrls: ['./hierarchy-treeview.component.scss'],
  providers: [{
    provide: TreeviewEventParser,
    useClass: AllCheckedTreeViewParser
  }],
})
export class HierarchyTreeviewComponent implements AfterViewInit, OnDestroy {

  @ViewChild(DropdownTreeviewComponent) treeViewCmp: DropdownTreeviewComponent;

  ngAfterViewInit(): void {

    // Selection listener
    this.subscriptions.push(
      this.selectionSubject
        .pipe(debounceTime(1000))
        .subscribe((data: any) => {
          this.renderNewTreeInstance();
        })
    );

    // Active selection listener
    this.subscriptions.push(
      interval(80).subscribe(() => {
        if(this.treeViewCmp && !this.selectionLock) {
          let length: number = this.selected?.length;
          this.treeViewCmp.buttonLabel = (length)?`${length} option(s) selected`:'Select Hierarchy';
        }
      }
    ));
  }

  public treeInput: Array <any> = [];
  public treeViewInput: Array <TreeviewItem> = [];
  public treeViewMap: Map <string, string> = new Map <string, string> ();

  private treeViewOptionsInternal: any = {
    hasAllCheckBox: false,
    hasFilter: false,
    hasCollapseExpand: false,
    decoupleChildFromParent: false,
    maxHeight: 240
  };
  public treeViewOptions = TreeviewConfig.create(this.treeViewOptionsInternal);

  private subscriptions: Array <Subscription> = [];
  private selectionSubject: Subject <any> = new Subject <any> ();
  private selectionLock: boolean = false;

  public defaults: Array <string> = [];
  @Input() allowDefaultSelection: boolean = false;
  @Input() allowDefaultClear: boolean = true;
  @Input('initialDefaults') set defaultSelections(data: any) {

    const isArray: boolean = Array.isArray(data);
    const isString: boolean = ((typeof data) === 'string');

    if(isArray)
      this.defaults = data;
    else if(isString)
      this.defaults = [data];
    else
      this.defaults = [];

  }

  private lastSelection: string = null;
  @Input() singleSelect: boolean = false;

  @Input('filter') set allowFilter(filter: boolean) {
    this.treeViewOptions = {
      ...this.treeViewOptionsInternal,
      hasFilter: filter
    };

    this.treeViewOptions = TreeviewConfig.create(this.treeViewOptions);
  }

  @Input('decoupleChildFromParent') set decoupleParent(flag: boolean) {
    this.treeViewOptions = {
      ...this.treeViewOptionsInternal,
      decoupleChildFromParent: flag
    };

    this.treeViewOptions = TreeviewConfig.create(this.treeViewOptions);
  }

  @Input() label: string = 'Hierarchy';
  @Input() disabled: boolean = false;
  @Input() mandatory: boolean = false;
  @Input() hierarchySupportText : string

  public selected: Array <string> = [];
  @Input('selected') set checkSelected(data: Array <string>) {

    if(!data) {
      data = [];
    }

    if(typeof(data) === 'string') {
      data = [data];
    }

    if(Array.isArray(data)) {
      let xor: Array <string> = _.xor(data, this.selected);
      if(xor?.length !== 0) {
        this.selected = data;
        this.selectionSubject.next(null);
      }
    }
  };

  @Output() changed: EventEmitter <Array <string>> = new EventEmitter <Array <string>> ();
  @Output() defaultChanged: EventEmitter <Array <string>> = new EventEmitter <Array <string>> ();

  @Input('treeInput') set intializeHierarchyTree(result: Array <any>) {

    let treeInputRecieved: Array <TreeNode> = result?.[0]?.hierarchies;
    if(!treeInputRecieved?.length && !this.treeInput?.length) {
      return;
    }

    this.treeInput = treeInputRecieved;
    this.selectionSubject.next(null);
  }

  private generateTreeViewItem(input: Array <any>): Array <TreeNode> {

    if(!input)
      return [];

    let treeList: Array <TreeNode> = [];
    if(Array.isArray(input)) {
      input.forEach((hierarchy: any) => {

        let { id, name, hierarchies, is_enabled } = hierarchy;
        if(Array.isArray(hierarchies)) {
          hierarchies.sort((h1: any, h2: any) => {
            let hName1: string = (h1?.name || '').toLowerCase();
            let hName2: string = (h2?.name || '').toLowerCase();
            return hName1.localeCompare(hName2);
          });
        }

        this.treeViewMap.set(id, name);
        treeList.push({
          text: name,
          value: id,
          checked: (this.selected || []).includes(id),
          disabled: (!is_enabled || this.disabled),
          children: this.generateTreeViewItem(hierarchies)
        });
      });
    }

    return treeList;
  }

  changeSelections(list: Array <string>) {
    
    if(_.xor(list, this.selected)?.length === 0) {
      return;
    }

    if(this.selectionLock) {
      return;
    }

    if(this.singleSelect) {

      // No selection
      if(!list?.length) {
        this.lastSelection = null;
        this.selected = [];
        this.selectionLock = true;
        this.initiateEntry(this.treeViewInput, this.lastSelection);
        return;
      }

      // DFS: First unique will be top-level parent clicked
      this.lastSelection = list.find((id: string) => (!this.selected.includes(id)));

      this.selectionLock = true;
      this.initiateEntry(this.treeViewInput, this.lastSelection);
      return;
    }

    this.selected = list;
    this.changed.emit(this.selected);
  }

  removeSelection(id: string) {
    if(Array.isArray(this.selected)) {

      let newerSelections: Array <string> = this.selected.filter((entry: string) => (entry !== id));
      let newerDefaults: Array <string> = this.defaults.filter((entry: string) => entry !== id);

      this.changed.emit(newerSelections);
      this.defaultChanged.emit(newerDefaults);
    }
  }

  // Single select mechanism
  private initiateEntry(input: TreeviewItem[], id: string) {

    if(Array.isArray(input)) {
      input.forEach((entry: TreeviewItem) => {
        this.singleSelectHelper(entry, id);
      });
    }

    this.selectionLock = false;
    this.selected = (id?[id]:[]);
    this.changed.emit(id?[id]:[]);
  }

  private singleSelectHelper(input: TreeviewItem, id: string) {
    
    if(!input)
      return;

    if(input.value === id) {
      input.checked = true;
      input['internalChecked'] = true;
    } else {
      input.checked = false;
      input['internalChecked'] = false;
    }

    const { children } = input;
    if(Array.isArray(children)) {
      children.forEach((child: TreeviewItem) => {
        this.singleSelectHelper(child, id);
      })
    }

    return;
  }

  changeDefaultOption(id: string) {

    if(this.defaults.includes(id)) {
      if(this.allowDefaultClear)
        this.defaults = [];
    } else {
      this.defaults = [id];
    }

    this.defaultChanged.emit(this.defaults);
  }

  private renderNewTreeInstance() {
    setTimeout(() => {
      this.treeViewMap.clear();
      if (Array.isArray(this.treeInput)) {
        let treeNodeList: Array <TreeNode> = this.generateTreeViewItem(this.treeInput);
        this.treeViewInput = _.cloneDeep(
          this.correctLibraryUpdates(
            treeNodeList.map((entry: TreeNode) => {
              return (new TreeviewItem({ ...entry }, false));
            }), treeNodeList
          )
        );
      } else {
        this.treeInput = [];
        this.treeViewInput = [];
      }
    }, 0);
  }

  private correctLibraryUpdates(config: Array <TreeviewItem>, recieved: Array <TreeNode>) {

    if(!config || !recieved) {
      return [];
    }

    for(let it: number = 0; it < config.length; it++) {
      config[it]['internalChecked'] = recieved[it]?.checked;
      this.correctLibraryUpdates(config[it]?.['internalChildren'] as Array <TreeviewItem>, recieved[it]?.children);
    }

    return config;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub?.unsubscribe();
    });
  }
}
