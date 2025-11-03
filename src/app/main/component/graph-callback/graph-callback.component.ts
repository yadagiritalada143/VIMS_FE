import { Component, OnInit } from '@angular/core';
 
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { Router,ActivatedRoute } from '@angular/router';
import { DashboardService } from 'src/app/dashboard/dashboard.service';

@Component({
  selector: 'app-graph-callback',
  templateUrl: './graph-callback.component.html',
  styleUrls: ['./graph-callback.component.scss']
})
export class GraphCallbackComponent implements OnInit {
   
  
  programId: any;
  grapherror:boolean=false
  public modules: any;
  constructor( 
    public router: Router,
    private route: ActivatedRoute,
    public alert: AlertService,
    public _storageService: StorageService,
    private dashboardService: DashboardService,
  ) {
   
  }

  ngOnInit(): void {
   
    let programDetails = this._storageService.get(StorageKeys.CURRENT_PROGRAM);
    
    let user=this._storageService.get(StorageKeys.CURRENT_USER);
   
    if (programDetails) {
      this.programId = programDetails['id'];
    }
    
    

    if((this.route.snapshot.queryParams['error']=='access_denied')){
      this.grapherror=true;
    } else if(this.route.snapshot.queryParams['code']){

       
      this.dashboardService.registerCalenderToken(this.programId,this.route.snapshot.queryParams['code'],this.route.snapshot.queryParams['state'],user.id).subscribe(res => {
        
        this.alert.success('Outlook configration completed successfully');
        this.router.navigate(['/dashboard']);
      }, err => {
        console.error(err);
      });
    }
    
   
  }

  
  
  
}
