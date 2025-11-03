import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { CreateTasklistComponent } from './create-tasklist.component';

describe('CreateTasklistComponent', () => {
  let component: CreateTasklistComponent;
  let fixture: ComponentFixture<CreateTasklistComponent>;
  CommonTestingModule.setUpTestBed(CreateTasklistComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateTasklistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateTasklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
