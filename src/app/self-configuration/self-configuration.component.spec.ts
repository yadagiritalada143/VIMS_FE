import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelfConfigurationComponent } from './self-configuration.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SelfConfigurationComponent', () => {
  let component: SelfConfigurationComponent;
  let fixture: ComponentFixture<SelfConfigurationComponent>;
  CommonTestingModule.setUpTestBed(SelfConfigurationComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
