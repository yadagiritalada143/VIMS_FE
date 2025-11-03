import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { DependentSelectionComponent } from './dependent-selection.component';

describe('DependentSelectionComponent', () => {
  let component: DependentSelectionComponent;
  let fixture: ComponentFixture<DependentSelectionComponent>;
  CommonTestingModule.setUpTestBed(DependentSelectionComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DependentSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DependentSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
