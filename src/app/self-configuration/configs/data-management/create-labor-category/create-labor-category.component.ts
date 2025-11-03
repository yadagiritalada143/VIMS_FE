import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-create-labor-category',
  templateUrl: './create-labor-category.component.html',
  styleUrls: ['./create-labor-category.component.scss']
})
export class CreateLaborCategoryComponent implements OnInit {
  title: string = 'Create New Labor Category';
  name: string = '';
  id : string ;
  buttonAction: string = "Save"
  public titleToggle = {
    title: 'active',
    value: true
  };

  constructor(
    private loader: LoaderService,
    private programService: ProgramService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    public storageService: StorageService,
    private activatedRoute: SvmsRouterService,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.id = params['id'];
      if(this.id) {
        this.title = 'Update Labor Category';
        this.buttonAction = "Update"
        this.getLaborCategoryDetails();
      }
    });
  }
  get programId() {
    return this.storageService.get(StorageKeys.PROGRAM_ID);
  }

  back(){
    this.activatedRoute.navigate(['data-management', 'labor-categories']);
  }

  onClickToggle() {
    if (this.titleToggle.value) {
      this.titleToggle.value = false;
      this.titleToggle.title = 'inactive';
    } else {
      this.titleToggle.value = true;
      this.titleToggle.title = 'active';
    }
  }
  getLaborCategoryDetails() {
    let url: string = `/configurator/programs/${this.programId}/industries/${this.id}`;
    this.programService.get(url).subscribe({
      next: (data: any) => {
        this.name = data?.industry_data?.name;
        this.titleToggle.value = data?.industry_data?.is_enabled
        this.loader.hide();
      }, error: (err: any) => {
        console.error(err);
        this.loader.hide();
        this.alertService.error(errorHandler(err));
      }
    });
  }
  saveVendorDistribution() {
      this.loader.show();
      const data = {
        "name": this.name,
        "is_enabled": this.titleToggle.value
      }
      if(!this.id){
      let url: string = `/configurator/programs/${this.programId}/industries`;
      this.programService.post(url, data).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.alertService.success(`Labor Category created successfully`);
          this.activatedRoute.navigate(['data-management', 'labor-view'], {
            queryParams: {
              id: data?.industry_id
            }
          });
        }, error: (err: any) => {
          console.error(err);
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        }
      });
    }else {
      let url: string = `/configurator/programs/${this.programId}/industries/${this.id}`;
      this.programService.put(url, data).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.alertService.success(`Labor Category updated successfully`);
          this.activatedRoute.navigate(['data-management', 'labor-view'], {
            queryParams: {
              id: data?.industry_id
            }
          });
        }, error: (err: any) => {
          console.error(err);
          this.loader.hide();
          this.alertService.error(errorHandler(err));
        }
      });
    }
    
  }
}
