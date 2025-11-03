import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListWorkLocationComponent } from './list-work-location.component';

describe('ListWorkLocationComponent', () => {
  let component: ListWorkLocationComponent;
  let fixture: ComponentFixture<ListWorkLocationComponent>;
  CommonTestingModule.setUpTestBed(ListWorkLocationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ListWorkLocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListWorkLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
