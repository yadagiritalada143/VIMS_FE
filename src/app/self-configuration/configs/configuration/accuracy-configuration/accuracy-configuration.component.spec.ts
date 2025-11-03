import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccuracyConfigurationComponent } from './accuracy-configuration.component';

describe('AccuracyConfigurationComponent', () => {
  let component: AccuracyConfigurationComponent;
  let fixture: ComponentFixture<AccuracyConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AccuracyConfigurationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AccuracyConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
