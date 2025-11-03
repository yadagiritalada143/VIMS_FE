import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { SsoSettingInfoComponent } from './sso-setting-info.component';

describe('SsoSettingInfoComponent', () => {
  let component: SsoSettingInfoComponent;
  let fixture: ComponentFixture<SsoSettingInfoComponent>;
  CommonTestingModule.setUpTestBed(SsoSettingInfoComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SsoSettingInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SsoSettingInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
