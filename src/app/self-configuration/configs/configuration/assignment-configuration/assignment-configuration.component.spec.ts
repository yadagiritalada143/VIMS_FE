import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignmentConfigurationComponent } from './assignment-configuration.component';

describe('AssignmentConfigurationComponent', () => {
  let component: AssignmentConfigurationComponent;
  let fixture: ComponentFixture<AssignmentConfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssignmentConfigurationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssignmentConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
