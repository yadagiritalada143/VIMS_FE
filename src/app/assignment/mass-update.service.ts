import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageKeys, StorageService } from '../../../src/app/core/services/storage.service';
@Injectable({
  providedIn: 'root'
})
export class MassUpdateService {
  private assignmentIds$ = new BehaviorSubject<any>([]);
  selectedAssignments$ = this.assignmentIds$.asObservable();
  private failedAssignment$ = new BehaviorSubject<any>([]);
  selectedFailedAssignments$ = this.assignmentIds$.asObservable();
  private allAssignments$ = new BehaviorSubject<any>([]);
  selectedAllAssignments$ = this.assignmentIds$.asObservable();
  dataSourceUrl: any[] = [
    {
      'slug': 'vendor_id',
      'datasource': {
        'page' : 1,
        'url': '/configurator/programs/${programId}/vendors?ordering=organization__name&active=true&limit=25',
        'type': 'url',
        'getBy': [
          'program_vendors'
        ]
      },
    },
    {
      'slug': 'source_type',
      'datasource': {
        'type': 'picklist',
        'options': [
          {
            'id': 'ee21ce38-2c1a-4056-9254-837fd1ba99cc',
            'slug': 'migrated_worker_data',
            'label': 'Migrated Worker Data'
          },
          {
            'id': 'dd84f65a-6a28-42f3-85cd-9991a01049f0',
            'slug': 'new_worker',
            'label': 'New Worker'
          }
        ]
      },
      "bind_value": "slug",
    },
    {
      'slug': 'assignment_manager',
      'id': 'assignment_manager',
      'label': 'Assignment Manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&limit=25',
        'type': 'url',
        'page' : 1,
        'getBy': [
          'members'
        ],
        'params': [
          {
            'name': 'job_id',
            'required': true
          }
        ]
      },
      "bind_value": "id",
      // "bind_label": "first_name",
      "bind_label": ['full_name'],
      "placeholder": "Select Assignment Manager",
      "type": "HUMAN_DROPDOWN"
    },{
      'slug': 'expense_manager',
      'id' : 'expense_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&limit=25',
        'type': 'url',
        'page':1,
        'getBy': [
          'members'
        ]
      },
      "bind_value": "id",
      // "bind_label": "first_name",
      "bind_label": ['full_name'],
      'label': 'Expense Manager',
      "placeholder": "Select Expense Manager",
      "type": "HUMAN_DROPDOWN"
    },
    {
      'slug': 'timesheet_manager',
      'id' : 'timesheet_manager',
      'datasource': {
        'url': '/configurator/programs/${programId}/members?org_category=CLIENT&info_level=basic&ordering=contact_name&is_enabled=true&limit=25',
        'type': 'url',
        'page' : 1,
        'getBy': [
          'members'
        ]
      },
      "bind_value": "id",
      // "bind_label": "first_name",
      "bind_label": ['full_name'],
      'label': 'Timesheet Manager',
      "placeholder": "Select Timesheet Manager",
      "type": "HUMAN_DROPDOWN"
    },
    {
      'slug': 'work_location',
      'id' : 'work_location',
      'datasource': {
        'url': '/configurator/programs/${programId}/work-locations/user-associated?limit=25&page=1&location_name=',
        'type': 'url',
        'getBy': [
          'associated_work_location'
        ]
      },
      "bind_value": "id",
      'label': 'Work Location',
      // "bind_label": "name",
      "bind_label": ['name' , 'code'],
      "separator":  "-",
      "placeholder": "Select Work location",
      "type": "HUMAN_DROPDOWN",

    },
    {
      'slug': 'sourcing_model',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=assignment_sourcing_model&is_enabled=true&order_by=asc',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'job_id',
      'datasource': {
        'url': '/job-manager/programs/${programId}/jobs?page=1&limit=10&title_or_template=',
        'type': 'url',
        'getBy': [
          'jobs'
        ]
      },
      "bind_value": "id",
    },
    {
      // &order_by=desc&key=ref_title Remove for  AMFMI-2546
      'slug': 'assignment_title_uuid',
      'datasource': {
        'url': '/job-manager/programs/${programId}/basic-job-templates?page=1&limit=10&is_enabled=True&template_name=',
        'type': 'url',
        'getBy': [
          'job_templates'
        ]
      },
      "bind_value": "id",
    }, 
    /*{
      'slug': 'shift_timing',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists//items?picklist_slug=shift_timing',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },*/
    {
      'slug': 'worker_classification',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=worker_classification&is_enabled=true&order_by=asc',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    /*  {//twice same code is written
       'slug': 'worker_classification',
       'datasource': {
         'url': '/configurator/programs/${programId}/picklists//items?picklist_slug=worker_classification&order_by=asc',
         'type': 'url',
         'getBy': [
           'picklist_items'
         ]
       },
       "bind_value": "label",
     }, */

    {
      'slug': 'days_per_week',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=no_of_working_days_week&is_enabled=true',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "label",
    },
    {
      'slug': 'rate_type',
      'datasource': {
        'url': '/configurator/programs/${programId}/picklists/*/items?picklist_slug=unit_of_measure&is_enabled=true',
        'type': 'url',
        'getBy': [
          'picklist_items'
        ]
      },
      "bind_value": "value",
    },
    {
      "id": "end_date",
      "slug": "end_date",
      "type": "DATE",
      "label": "Assignment End Date",
      "date_format" : this.getDefaultDateFormat(),
      "source": "SYSTEM",
      "meta_data": {
          "col": 4,
          "rules": [
              {
                  "slug": "start_date",
                  "message": "Assignment End Date should be greater than Assignment Start Date.",
                  "condition": "ltr_equal"
              }
          ]
      },
      "is_readonly": false,
      "is_required": true,
      "placeholder": "Choose Date",
      "is_update_allow": true,
  }
  ];

  constructor(private storageService: StorageService) { }

  setAssignmetIds(assignmentIds: any) {
    this.assignmentIds$.next(assignmentIds);
  }
  setFailedAssignment(assignments: any) {
    this.failedAssignment$.next(assignments);
  }
  setAllAssignment(assignments:any) {
    this.allAssignments$.next(assignments);
  }
  getDefaultDateFormat(){
    return  this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat;
 }
}
