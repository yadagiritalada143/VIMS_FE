import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { EditChecklistComponent } from './edit-checklist.component';

describe('EditChecklistComponent', () => {
  let component: EditChecklistComponent;
  let fixture: ComponentFixture<EditChecklistComponent>;
  CommonTestingModule.setUpTestBed(EditChecklistComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditChecklistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
