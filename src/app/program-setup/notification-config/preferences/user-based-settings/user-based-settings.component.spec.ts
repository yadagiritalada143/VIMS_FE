import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { UserBasedSettingsComponent } from './user-based-settings.component';

describe('UserBasedSettingsComponent', () => {
  let component: UserBasedSettingsComponent;
  let fixture: ComponentFixture<UserBasedSettingsComponent>;
  CommonTestingModule.setUpTestBed(UserBasedSettingsComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserBasedSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserBasedSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
