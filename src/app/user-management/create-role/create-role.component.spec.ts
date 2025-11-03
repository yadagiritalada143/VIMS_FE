import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateRoleComponent } from './create-role.component';
import { CredentialingService } from 'src/app/shared/service/credentialing.service';

describe('CreateRoleComponent', () => {
  let component: CreateRoleComponent;
  let fixture: ComponentFixture<CreateRoleComponent>;
  CommonTestingModule.setUpTestBed(CreateRoleComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreateRoleComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('processGroupData', () => {

    let mockCredentialingService: CredentialingService


    beforeEach(() => {
      mockCredentialingService = TestBed.inject(CredentialingService);
    });


    it('for feature enabled, set Credentialing overrideEmptyPermission and is_enabled if is_hidden', () => {
      spyOn(mockCredentialingService, 'isEnable').and.callFake(()=>true);

      const originalData = [
        { name: 'Credentialing', is_hidden: true, is_enabled: false },
        { name: 'Credentialing', is_hidden: false, is_enabled: false },
      ];
      component.moduleGroup = originalData.slice(); // Create a copy to avoid mutation
      component.processGroupData();
      expect(component.moduleGroup).toEqual([
        { name: 'Credentialing', is_hidden: true, is_enabled: true, overrideEmptyPermission: true },
        { name: 'Credentialing', is_hidden: false, is_enabled: false, overrideEmptyPermission: true },
      ]);
    });

    it('for feature disable, set Credentialing overrideEmptyPermission and is_enabled false ', () => {
      spyOn(mockCredentialingService, 'isEnable').and.callFake(()=>false);

      const originalData = [
        { name: 'Credentialing', is_hidden: true, is_enabled: false },
      ];
      component.moduleGroup = originalData.slice(); // Create a copy to avoid mutation
      component.processGroupData();
      expect(component.moduleGroup).toEqual([
        { name: 'Credentialing', is_hidden: true, is_enabled: false, overrideEmptyPermission: true },
      ]);
    });

    it('should enable hidden groups (except Credentialing)', () => {
      const originalData = [
        { name: 'OtherGroup1', is_hidden: true, is_enabled: false },
      ];
      component.moduleGroup = originalData.slice(); // Create a copy
      component.processGroupData();
      expect(component.moduleGroup).toEqual([
        { name: 'OtherGroup1', is_hidden: true, is_enabled: true },
      ]);
    });


  });
});
