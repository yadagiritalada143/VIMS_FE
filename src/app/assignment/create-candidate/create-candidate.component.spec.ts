import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { CreateCandidateComponent } from './create-candidate.component';
import { SvmsDatepickerComponent } from 'src/app/shared/components/svms-datepicker/svms-datepicker.component';
import { SearchAddressComponent } from 'src/app/shared/components/search-address/search-address.component';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';
import { ConfirmationDialogService } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { I18N_PROVIDERS } from 'src/app/i18nextHelper';
import i18next from 'i18next';
import translation from 'src/assets/i18n/en-US.json'

describe('CreateCandidateComponent', () => {
  let component: CreateCandidateComponent;
  let fixture: ComponentFixture<CreateCandidateComponent>;
  let mockCredentialingService: jasmine.SpyObj<CredentialingService>;
  let mockConfirmationDialogService: jasmine.SpyObj<ConfirmationDialogService>;
  let mockRoute: jasmine.SpyObj<Router>;

  CommonTestingModule.setUpTestBed(CreateCandidateComponent);

  beforeEach(() => {
    spyOn(i18next, 't').and.callFake((key) => translation[key]);
  });

  beforeEach(waitForAsync(() => {
    mockCredentialingService = jasmine.createSpyObj('CredentialingService', ['canViewCredentialing', 'isEnable', 'syncCandidate']);
    mockConfirmationDialogService = jasmine.createSpyObj('ConfirmationDialogService', ['confirm']);
    mockRoute = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [CreateCandidateComponent, SvmsDatepickerComponent, SearchAddressComponent],
      providers: [
        { provide: CredentialingService, useValue: mockCredentialingService },
        { provide: ConfirmationDialogService, useValue: mockConfirmationDialogService },
        { provide: Router, useValue: mockRoute },
        I18N_PROVIDERS[0],
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateCandidateComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the create candidate button text to "Save And Continue" when credentialing is enabled', () => {
    mockCredentialingService.canViewCredentialing.and.returnValue(true);

    fixture.detectChanges();

    expect(component.create_candidate).toBe('Save And Continue');
  });

  it('should set the create candidate button text to "Create Candidate" when credentialing is disabled', () => {
    mockCredentialingService.canViewCredentialing.and.returnValue(false);

    fixture.detectChanges();

    expect(component.create_candidate).toBe('Create Candidate');
  });

  it('should call confirmService with correct options if credentialing is enabled and syncCandidate succeeds', () => {
    const mockData = { id: '1' };
    mockCredentialingService.isEnable.and.returnValue(true);
    mockCredentialingService.syncCandidate.and.returnValue(of({}));
    mockCredentialingService.canViewCredentialing.and.returnValue(true);

    fixture.detectChanges();
    component.syncAndAskIfAddCredentialing(mockData);

    expect(mockCredentialingService.syncCandidate).toHaveBeenCalledWith(mockData.id);
    expect(mockConfirmationDialogService.confirm).toHaveBeenCalledWith('Confirmation', 'Do you wish to add Credentials?', 'Yes', 'No');
  });

  it('should not call confirmService if credentialing feature is disabled', () => {
    const mockData = { id: '1' };
    mockCredentialingService.isEnable.and.returnValue(false);
    mockCredentialingService.syncCandidate.and.returnValue(of({}));

    fixture.detectChanges();
    component.syncAndAskIfAddCredentialing(mockData);

    expect(mockCredentialingService.syncCandidate).toHaveBeenCalledWith(mockData.id);
    expect(mockConfirmationDialogService.confirm).not.toHaveBeenCalled();
  });

  it('should navigate to credentials page if user confirms', fakeAsync(() => {
    const mockData = { id: '1' };
    mockCredentialingService.syncCandidate.and.returnValue(of({}));
    mockCredentialingService.canViewCredentialing.and.returnValue(true);
    mockConfirmationDialogService.confirm.and.returnValue(Promise.resolve(true)); // Mock user confirmation
    mockRoute.navigate.and.returnValue(null);

    fixture.detectChanges();
    component.syncAndAskIfAddCredentialing(mockData);
    tick(1000);
    expect(mockRoute.navigate).toHaveBeenCalledWith(['/candidates/candidate/1/credentials']);
  }));

  it('should set log properties correctly for an error with status 400', () => {
    const error = { message: 'Bad request' };
    const err = { status: 400, error: { error } };
    component.showError(err);

    expect(component.logs.type).toBe(LOG_TYPE.ERROR);
    expect(component.logs.heading).toBe('Bad request');
    expect(component.logs.messages).toEqual([]);
    expect(component.logs.showReportButton).toBe(true);
    expect(component.logs.additionalInfo.trace_id).toBeUndefined(); // If applicable
  });
});
