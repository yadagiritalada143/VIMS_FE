import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { RoleBasedSettingsComponent } from './role-based-settings.component';

describe('RoleBasedSettingsComponent', () => {
  let component: RoleBasedSettingsComponent;
  let fixture: ComponentFixture<RoleBasedSettingsComponent>;
  CommonTestingModule.setUpTestBed(RoleBasedSettingsComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoleBasedSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoleBasedSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
