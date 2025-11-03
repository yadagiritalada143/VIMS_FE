import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeesConfigurationComponent } from './fees-configuration.component';

describe('FeesConfigurationComponent', () => {
  let component: FeesConfigurationComponent;
  let fixture: ComponentFixture<FeesConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeesConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeesConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
