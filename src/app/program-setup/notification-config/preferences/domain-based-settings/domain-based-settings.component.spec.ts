import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { DomainBasedSettingsComponent } from './domain-based-settings.component';

describe('DomainBasedSettingsComponent', () => {
  let component: DomainBasedSettingsComponent;
  let fixture: ComponentFixture<DomainBasedSettingsComponent>;
  CommonTestingModule.setUpTestBed(DomainBasedSettingsComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DomainBasedSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainBasedSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
