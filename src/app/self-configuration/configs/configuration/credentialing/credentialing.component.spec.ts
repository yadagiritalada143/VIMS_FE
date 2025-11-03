import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CredentialingComponent } from './credentialing.component';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';
import { LoaderService } from 'src/app/core/components/loader/loader.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { LOG_TYPE } from 'src/app/library/logs/logs.model';
import { I18NextModule } from 'angular-i18next';
import { I18N_PROVIDERS } from 'src/app/i18nextHelper';

describe('CredentialingComponent', () => {
  let component: CredentialingComponent;
  let fixture: ComponentFixture<CredentialingComponent>;
  let mockLocalStorage: jasmine.SpyObj<StorageService>;
  let mockCredentialingService: jasmine.SpyObj<CredentialingService>;
  let mockLoaderService: jasmine.SpyObj<LoaderService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockI18next: any; // Assuming i18next is mocked elsewhere

  beforeEach(async () => {
    mockLocalStorage = jasmine.createSpyObj('StorageService', ['get']);
    mockCredentialingService = jasmine.createSpyObj('CredentialingService', ['canViewCredentialing']);
    mockLoaderService = jasmine.createSpyObj('LoaderService', ['']);
    mockActivatedRoute = jasmine.createSpyObj('ActivatedRoute', ['']);
    mockI18next = { t: (key: string) => key }; // Mock simple translation

    await TestBed.configureTestingModule({
      declarations: [CredentialingComponent],
      imports: [I18NextModule.forRoot()],
      providers: [
        { provide: StorageService, useValue: mockLocalStorage },
        { provide: CredentialingService, useValue: mockCredentialingService },
        { provide: LoaderService, useValue: mockLoaderService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        I18N_PROVIDERS[0],
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CredentialingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should show widget when credentialing is enabled and program details retrieved', () => {
      const programDetails = { credProgramId: 1 };
      mockLocalStorage.get.and.returnValue(of(programDetails));
      mockCredentialingService.canViewCredentialing.and.returnValue(true);

      fixture.detectChanges();

      expect(mockLocalStorage.get).toHaveBeenCalledWith(StorageKeys?.CURRENT_PROGRAM);
      expect(mockCredentialingService.canViewCredentialing).toHaveBeenCalled();
      expect(component.showWidget).toBeTrue();
      expect(component.logs).toBeUndefined();
    });

    it('should show error message when credentialing is disabled', () => {
      mockCredentialingService.canViewCredentialing.and.returnValue(false);

      fixture.detectChanges();

      expect(component.logs.type).toBe(LOG_TYPE.ERROR);
      expect(component.logs.heading).toBe('Credentialing Not Enabled');
      expect(component.logs.showReportButton).toBeFalse();
    });
  });

  it('getCredProgramId should return credProgramId from programDetails', () => {
    component.programDetails = { credProgramId: 42 };
    expect(component.getCredProgramId()).toBe(42);
  });

  describe('showError', () => {
    it('should set log properties for an error with status 400', () => {
      const error = { message: 'Bad request' }
      const err = { status: 400, error: { error } };
      component.showError(err);

      expect(component.logs.type).toBe(LOG_TYPE.ERROR);
      expect(component.logs.heading).toBe('Bad request');
      expect(component.logs.showReportButton).toBeTrue();
    });

    it('should handle error without status or message', () => {
      component.showError({});
      expect(component.logs.heading).toBe('');
    });

    it('should handle errors with trace ID', () => {
      const err = { error: { trace_id: 'abc123' } };
      component.showError(err);

      expect(component.logs.additionalInfo.trace_id).toBe('abc123');
    });
  });
});
