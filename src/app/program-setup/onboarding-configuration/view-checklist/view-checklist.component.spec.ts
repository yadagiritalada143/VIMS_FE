import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ViewChecklistComponent } from './view-checklist.component';

describe('ViewChecklistComponent', () => {
  let component: ViewChecklistComponent;
  let fixture: ComponentFixture<ViewChecklistComponent>;
  CommonTestingModule.setUpTestBed(ViewChecklistComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewChecklistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
