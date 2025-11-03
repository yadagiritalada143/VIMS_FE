import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListQualificationTypesComponent } from './list-qualification-types.component';

describe('ListQualificationTypesComponent', () => {
  let component: ListQualificationTypesComponent;
  let fixture: ComponentFixture<ListQualificationTypesComponent>;
  CommonTestingModule.setUpTestBed(ListQualificationTypesComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListQualificationTypesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListQualificationTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
