import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/core/components/alert/alert.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { SvmsRouterService } from 'src/app/core/services/svms-router.service';
import { ProgramService } from 'src/app/programs/program.service';
import { Log, LOG_TYPE } from 'src/app/library/logs/logs.model';
import { ActivatedRoute } from '@angular/router';
import { errorHandler } from 'src/app/shared/util/error-handler';

@Component({
  selector: 'app-create-cost-component',
  templateUrl: './create-cost-component.component.html',
  styleUrls: ['./create-cost-component.component.scss']
})
export class CreateCostComponentComponent implements OnInit {
  name: string = '';
  code: string = '';
  isActive: boolean = true;
  isEdit: boolean = false;
  costComponentId: any;
  programId: any;
  logs: Log= undefined;
  codePattern: RegExp = /^[a-zA-Z0-9\-_]{0,}$/gm;

  constructor(
    private router: SvmsRouterService,
    private programService: ProgramService,
    private storageService: StorageService,
    private alertService: AlertService,
    private loader: LoaderService,
    private activatedRoute: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.programId = this.storageService.get(StorageKeys.PROGRAM_ID);
    this.costComponentId = this.activatedRoute.snapshot.params.id;

    if (this.costComponentId) {
      this.isEdit = true;
      this.getCostComponent();
    }
  }

  getCostComponent() {
    this.loader.show();

    this.programService.get(`/core-money/programs/${this.programId}/cost-component/component/${this.costComponentId}`).subscribe({
      next: (data: any) => {
        this.loader.hide();
        const costComponent = data?.cost_componet_data;
        if (costComponent) {
          this.name = costComponent.name || '';
          this.isActive = !!costComponent.is_enabled;
          this.code = costComponent.code || '';
        }
      },
      error: (err) => {
        this.loader.hide();
        this.router.navigate(['rate', 'cost-component', 'list']);
        this.alertService.error(errorHandler(err));
      }
    });
  }

  toggleActive(): void {
    this.isActive = !this.isActive;
  }

  backToList(): void {
    this.router.navigate(['rate', 'cost-component', 'list']);
  }

  showError(err){
    window.scrollTo(0, 0);

    this.logs = {
      type: LOG_TYPE.ERROR,
      heading: err?.error?.error?.message ? err?.error?.error?.message : (typeof err == 'string' ? err : ''), messages: [], autoClose: true, isShown: true,
      showReportButton: err?.status == 500,
      additionalInfo:{trace_id: err?.error?.trace_id }
    };

    err?.error?.error?.errors?.forEach(msg => {      
      if (msg?.message) {      
        this.logs.messages.push(msg?.message);
      }
    });
  }

  isCodeValid() {
    const code = this.code.trim();
    if (code.length < 4 || code.length > 20 || !code.match(this.codePattern)) {
      this.showError('Code should be between 4 and 20 characters, and should only include alphabets, numbers, `-`s and `_`s');
      return false;
    }
    this.code = code;
    return true;
  }

  submit(): void {
    if (!this.isCodeValid()) {
      return;
    }

    const payload = {
      name: this.name,
      code: this.code,
      is_enabled: this.isActive
    };

    this.loader.show();
    if (this.isEdit) {
      this.programService.put(`/core-money/programs/${this.programId}/cost-component/component/${this.costComponentId}`, payload).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.router.navigate(['rate', 'cost-component', 'details', data?.cost_component_id]);
          this.alertService.success('Cost Component updated successfully');
        },
        error: (err) => {
          this.loader.hide();
          this.showError(err);
        }
      });
    } else {
      this.programService.post(`/core-money/programs/${this.programId}/cost-component/component`, payload).subscribe({
        next: (data: any) => {
          this.loader.hide();
          this.router.navigate(['rate', 'cost-component', 'details', data?.cost_component_id]);
          this.alertService.success('Cost Component created successfully');
        },
        error: (err) => {
          this.loader.hide();
          this.showError(err);
        }
      });
    }
  }
}
