import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModulesComponent } from './modules.component';

describe('ModulesComponent', () => {
  let component: ModulesComponent;
  let fixture: ComponentFixture<ModulesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ModulesComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ModuleListParser', () => {
    it('should filter hidden modules if hideHiddenModules is true', () => {
      const input = [
        { is_hidden: true },
        { is_hidden: false },
        { is_hidden: undefined }, // Test undefined case
      ];

      const expectedOutput = [
        { is_hidden: false },
        { is_hidden: undefined }, // Keep undefined for consistency
      ];
      component.hideHiddenModules = true;
      expect(component.moduleListParser(input)).toEqual(expectedOutput);
    });

    it('should keep hidden modules if hideHiddenModules is false', () => {
      const input = [{ is_hidden: true }, { is_hidden: false }];
      const expectedOutput = input;
      component.hideHiddenModules = false;
      expect(component.moduleListParser(input)).toEqual(expectedOutput);
    });

    it('should filter modules with empty permission lists if hideEmptyPermissionModules is true', () => {
      const input = [
        { modules: [{ permissions: [] }] }, // Empty permissions
        { modules: [{ permissions: ['perm1'] }] }, // Non-empty permissions
      ];
      const expectedOutput = [{ modules: [{ permissions: ['perm1'] }] }];
      component.hideEmptyPermissionModules = true;
      expect(component.moduleListParser(input)).toEqual(expectedOutput);
    });

    it('should keep modules with non-empty permission lists if hideEmptyPermissionModules is false', () => {
      const input = [
        { modules: [{ permissions: [] }] }, // Empty permissions
        { modules: [{ permissions: ['perm1'] }] }, // Non-empty permissions
      ];
      const expectedOutput = input;
      component.hideEmptyPermissionModules = false;
      expect(component.moduleListParser(input)).toEqual(expectedOutput);
    });
  });
});
