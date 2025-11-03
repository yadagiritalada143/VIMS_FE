import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { AuthorizationService } from 'src/app/core/services/authorize.service';
import { EmitEvent, EventStreamService, Events } from 'src/app/core/services/event-stream.service';
import { StorageService } from 'src/app/core/services/storage.service';
import { TreeComponent } from 'src/app/library/tree/tree.component';
import { VMSTreeConfig } from 'src/app/library/tree/tree.model';
import { ProgramService } from 'src/app/programs/program.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { HierarchyConfig } from 'src/app/shared/enums';
import { ProgramConfig } from '../../../shared/enums';
import { errorHandler } from '../../../shared/util/error-handler';

@Component({
  selector: 'app-hierarchy-configuration',
  templateUrl: './hierarchy-configuration.component.html',
  styleUrls: ['./hierarchy-configuration.component.scss']
})
export class HierarchyConfigurationComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  vmsData: any;
  public eventParentNode;
  searchTerm: any;
  isAdvanceSearch = false;
  flattednedHierarchy: any = [];
  filterpayLoad: any = {};
  @ViewChild(TreeComponent) appTree: TreeComponent;
  private searchHierarchySub: Subject<any> = new Subject<any>();

  public treeConfig: VMSTreeConfig = {
      title: 'Hierarchies',
      isSearch: true,
      isSetting: true,
      isFilter: true,
      isTopPagination: true,
      columnList:[
        {name: 'hierarchies', title: 'Hierarchy Level Name', width:45, isImage: false, isIcon: false, isVisible: true,
          isCreate: this.authService.authorize('create_hierarchy')
        },
        {name: 'managers', title: 'Manager', width: 20, isImage: false, isIcon: false, isVisible: true},
        {name: 'modified_on', title:  'Updated Date', width: 15, isImage: false, isIcon: false, isVisible: true},
        {
          name: 'is_enabled',
          title: 'Status',
          width: 13,
          isImage: false,
          isIcon: false,
          isView: this.authService.authorize('view_hierarchy'),
          isCreate: this.authService.authorize('create_hierarchy'),
          isEdit: this.authService.authorize('update_hierarchy'),
          isDisable: this.authService.authorize('update_hierarchy'),
          isDelete: this.authService.authorize('delete_hierarchy'),
          isVisible: true
        },
      ]
  }

  constructor(
    private _programService: ProgramService,
    private _storageService: StorageService,
    private eventStream: EventStreamService,
    private _alertService : AlertService,
    private _confirmService : ConfirmationDialogService,
    private loader: LoaderService,
    private authService: AuthorizationService
  ) { }

  ngOnInit(): void {
    this.hierarchyList();
    this.subscriptions.push(this.eventStream.on(Events.CREATE_HIERARCHY).subscribe((data:any) => {
      if (!data) {
        this.hierarchyList();
      }
    }));
    this.subscriptions.push(this.eventStream.on(Events.EDIT_HIERARCHY).subscribe((data:any) => {
      if (!data) {
        this.hierarchyList();
      }
    }));
    this.searchHierarchySub
      .pipe(debounceTime(600))
      .subscribe((term: any) => {
        this.searchTerm = term;
        this.hierarchyList();
      })
  }

  hierarchyList() {
    let programDetails = JSON.parse(this._storageService.get('NewProgramData'));
    let programId = programDetails?.['program_req_id'];
    let url = `/configurator/programs/${programId}/hierarchy`;
    if (!!this.filterpayLoad && Object.keys(this.filterpayLoad)?.length > 0) {
      url+=`?advance_filter=true`;
      if(this.filterpayLoad?.name){
        url+=`&name=${this.filterpayLoad?.name.join(',')}`;
      }
      if(this.filterpayLoad?.is_enabled==true || this.filterpayLoad?.is_enabled==false){
        url+=`&active=${this.filterpayLoad?.is_enabled}`;
      }
    }
    else if(this.searchTerm){
      url+=`?k=${this.searchTerm}`;
    }
    this.loader.show();
    this.subscriptions.push(this._programService.get(url).subscribe(
      (data:any) => {
        if (data) {
          this.vmsData = data.result[0].hierarchies;
          this.flattednedHierarchy = [];
          this.flattenHierarchy(data.result[0].hierarchies);
          if((!!this.filterpayLoad && Object.keys(this.filterpayLoad)?.length > 0) || this.searchTerm) {
            this.vmsData = [];
            for(let i=0;i<this.flattednedHierarchy?.length;i++){
              for(let j=0;j<data.result[0]?.filtered_hierarchy_names?.length;j++){
                if(data.result[0]?.filtered_hierarchy_names[j]?.id == this.flattednedHierarchy[i]?.id){
                  this.vmsData.push({...data.result[0]?.filtered_hierarchy_names[j], modified_on: this.flattednedHierarchy[i]?.modified_on,hierarchies: [], managers: this.flattednedHierarchy[i]?.managers});
                }
              }
            }
          }
          this.loader.hide();
          //This is temperory comment may be later can be used.
          this._storageService.set(HierarchyConfig[0], data.result[0].hierarchies, true);
        }
      }));
  }

  flattenHierarchy = (hierarchies: any) => {
    if(hierarchies?.length < 1){
      return ;
    }
    hierarchies?.forEach((hierarchy: any) => {
      this.flattednedHierarchy.push(hierarchy);
      this.flattenHierarchy(hierarchy?.hierarchies);
    })
  }

  onSearch = (term: any) => {
    this.searchHierarchySub.next(term);
  }

  onListFilter = (event: any) => {
    this.isAdvanceSearch = true;
    this.filterpayLoad = event;
    this.hierarchyList();
  }

  onCreateClick() {
    this.eventStream.emit(new EmitEvent(Events.CREATE_HIERARCHY, true));
  }
  getParentViewNode(childNodeData) {
    //assuming for now it will have only one parent node and under this index all node will occure.
    const nodeData = this._storageService.get(HierarchyConfig[0]);
    var viewNodeReturn;
    const checkNested = (nodedata) => {
      return nodedata?.forEach(element => {
        if (element.hierarchy_level === (childNodeData.hierarchy_level - 1)) {
          if (element?.hierarchies) {
            return element?.hierarchies.forEach((ele, key) => {
              if (ele.id === childNodeData.id) {
                viewNodeReturn = element;
                return element;
              }
            });
          }
        } else {
          checkNested(element?.hierarchies);
        }
      });
    }
    checkNested(nodeData)
    return viewNodeReturn;


  }
  onDisableClicked(evt){
    let event = this.flattednedHierarchy?.find((hierarchy: any) => hierarchy?.id == evt.id);
    let action = '';
    if(event.is_enabled){
      action = 'disable';
    }else{
      action = 'enable';
    }
    this._confirmService.confirm('', `Are you sure to ${action} the ${event.name}?`,
    'Yes','No')
      .then((confirmed) =>{
        if(confirmed){
          const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
          const programId = programDetails['program_req_id'];
          const viewParentNodeData = this.getParentViewNode(event);
          this.eventParentNode = { ...viewParentNodeData };
          let selected_member = event.managers;
          let arr = selected_member.map(({ user_id }) => user_id);
          let foundational_data = event.foundational_data;
          let foundational_data_arr = foundational_data.map(({ id }) => id);

          const levelData = event;
          const payload = {
            "parent": this.eventParentNode.id,
            "name": levelData.name,
            "preferred_currency": null,
            "preferred_language": null,
            "is_enabled": levelData.is_enabled ? false : true,
            "foundational_data": foundational_data_arr,
            "managers": arr,
            "addresses": null,
            "contacts": null
          }
          this.subscriptions.push( this._programService.put(`/configurator/programs/${programId}/hierarchy/${event.id}`, payload)
          .subscribe({
            next: (resp:any) => {
              if (resp) {
                this._alertService.success(`Hierarchy level ${action}d succesfully..`);
                this.hierarchyList();
              }
            },
            error: (error) => {
              this._alertService.error(errorHandler(error));
            }
          }));
        }
      }
    )
   .catch(() =>
     console.error('User dismissed the dialog')
   );
  }
  //delete hierarchy level
  onDeleteClicked(event){
    const programDetails = JSON.parse(this._storageService.get(ProgramConfig[0]));
    const programId = programDetails['program_req_id'];
    this._confirmService.confirm('', `Are you sure to delete the ${event.name}?`,
    'Yes','No')
      .then((confirmed) =>{
        if(confirmed){
          this.subscriptions.push(this._programService.delete(`/configurator/programs/${programId}/hierarchy/${event.id}`)
        .subscribe(
          (resp:any) => {
            if (resp) {
              this._alertService.success(`Hierarchy level deleted succesfully..`);
              this.hierarchyList();
            }
          },
          (error) => {
            this._alertService.error(errorHandler(error));
          }
        ));
      }
     }
    )
   .catch(() =>
     console.error('User dismissed the dialog')
   );
  }
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub.unsubscribe());
  }
}
