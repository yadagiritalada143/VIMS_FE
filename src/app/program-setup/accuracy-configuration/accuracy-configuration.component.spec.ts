import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { AccuracyConfigurationComponent } from './accuracy-configuration.component';

describe('AccuracyConfigurationComponent', () => {
  let component: AccuracyConfigurationComponent;
  let fixture: ComponentFixture<AccuracyConfigurationComponent>;
  CommonTestingModule.setUpTestBed(AccuracyConfigurationComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccuracyConfigurationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccuracyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
